import type { KVNamespace } from '@cloudflare/workers-types';

interface DriveEnv {
  MAP132_KV?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MY_DRIVE_SESSION_SECRET?: string;
}

const COOKIE = 'map132_drive_session';
const STATE_TTL = 600;
const SESSION_TTL = 3500;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const encoder = new TextEncoder();

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...Object.fromEntries(new Headers(headers)),
    },
  });

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', await sha256(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encrypt(value: unknown, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(secret),
    encoder.encode(JSON.stringify(value)),
  );
  return b64url(new Uint8Array([...iv, ...new Uint8Array(ciphertext)]));
}

async function decrypt<T>(value: string, secret: string): Promise<T> {
  const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    await encryptionKey(secret),
    bytes.slice(12),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function cookieValue(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : null;
}

function sessionCookie(value: string, maxAge: number): string {
  return COOKIE + '=' + encodeURIComponent(value) +
    '; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive; Max-Age=' + maxAge;
}

function clearCookie(): string {
  return COOKIE + '=; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive; Max-Age=0';
}

function configReady(env: DriveEnv): boolean {
  return Boolean(env.MAP132_KV && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.MY_DRIVE_SESSION_SECRET);
}

async function readSession(request: Request, env: DriveEnv): Promise<{ access_token: string; expires_at: number } | null> {
  const id = cookieValue(request);
  if (!id || !env.MAP132_KV || !env.MY_DRIVE_SESSION_SECRET) return null;
  const stored = await env.MAP132_KV.get('my-drive/session/' + id);
  if (!stored) return null;
  try {
    const session = await decrypt<{ access_token: string; expires_at: number }>(stored, env.MY_DRIVE_SESSION_SECRET);
    if (session.expires_at <= Date.now()) {
      await env.MAP132_KV.delete('my-drive/session/' + id);
      return null;
    }
    return session;
  } catch {
    await env.MAP132_KV.delete('my-drive/session/' + id);
    return null;
  }
}

/** Handles the server-side, read-only Google Drive OAuth and listing endpoints. */
export async function handleMyDriveOAuth(request: Request, env: DriveEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/my-drive/')) return null;

  if (!configReady(env)) {
    return json({ error: 'My Drive connection is not configured. Add the required Worker secrets and MAP132_KV binding.' }, 503);
  }

  if (path === '/api/my-drive/oauth/start' && request.method === 'POST') {
    const state = randomToken();
    const verifier = randomToken(48);
    const challenge = b64url(await sha256(verifier));
    const redirectUri = new URL('/api/my-drive/oauth/callback', url.origin).toString();
    await env.MAP132_KV!.put('my-drive/oauth-state/' + state, verifier, { expirationTtl: STATE_TTL });
    const authorize = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorize.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', DRIVE_SCOPE);
    authorize.searchParams.set('access_type', 'online');
    authorize.searchParams.set('include_granted_scopes', 'true');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    return json({ authorizationUrl: authorize.toString(), redirectUri });
  }

  if (path === '/api/my-drive/oauth/callback' && request.method === 'GET') {
    const state = url.searchParams.get('state') || '';
    const code = url.searchParams.get('code') || '';
    const verifier = state ? await env.MAP132_KV!.get('my-drive/oauth-state/' + state) : null;
    if (!verifier || !code) return json({ error: 'OAuth state expired or authorization was cancelled. Start again.' }, 400);
    await env.MAP132_KV!.delete('my-drive/oauth-state/' + state);
    const redirectUri = new URL('/api/my-drive/oauth/callback', url.origin).toString();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) return json({ error: 'Google token exchange failed. Check OAuth client settings and callback URL.' }, 502);
    const token = await tokenResponse.json() as { access_token?: string; expires_in?: number; scope?: string };
    if (!token.access_token || !String(token.scope || '').split(' ').includes(DRIVE_SCOPE)) {
      return json({ error: 'Google did not grant the required read-only Drive permission.' }, 403);
    }
    const sessionId = randomToken();
    const expiresAt = Date.now() + Math.min(Number(token.expires_in || SESSION_TTL), SESSION_TTL) * 1000;
    const encrypted = await encrypt({ access_token: token.access_token, expires_at: expiresAt }, env.MY_DRIVE_SESSION_SECRET!);
    await env.MAP132_KV!.put('my-drive/session/' + sessionId, encrypted, {
      expirationTtl: Math.max(60, Math.floor((expiresAt - Date.now()) / 1000)),
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/#workspace?myDrive=connected', url.origin).toString(),
        'Cache-Control': 'no-store',
        'Set-Cookie': sessionCookie(sessionId, Math.max(60, Math.floor((expiresAt - Date.now()) / 1000))),
      },
    });
  }

  if (path === '/api/my-drive/session' && request.method === 'GET') {
    const session = await readSession(request, env);
    return json({ connected: Boolean(session), expiresAt: session?.expires_at ?? null });
  }

  if (path === '/api/my-drive/oauth/logout' && request.method === 'POST') {
    const id = cookieValue(request);
    if (id) await env.MAP132_KV!.delete('my-drive/session/' + id);
    return json({ disconnected: true }, 200, { 'Set-Cookie': clearCookie() });
  }

  if (path === '/api/my-drive/files' && request.method === 'GET') {
    const session = await readSession(request, env);
    if (!session) return json({ error: 'Connect Google Drive again to continue.' }, 401);
    const pageToken = url.searchParams.get('pageToken');
    const parentId = url.searchParams.get('parentId');
    const query = ["trashed = false", parentId ? "'" + parentId.replace(/[^a-zA-Z0-9_-]/g, '') + "' in parents" : null]
      .filter(Boolean).join(' and ');
    const driveUrl = new URL('https://www.googleapis.com/drive/v3/files');
    driveUrl.searchParams.set('q', query);
    driveUrl.searchParams.set('pageSize', '100');
    driveUrl.searchParams.set('orderBy', 'folder,name');
    driveUrl.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,md5Checksum)');
    if (pageToken) driveUrl.searchParams.set('pageToken', pageToken);
    const response = await fetch(driveUrl, {
      headers: { Authorization: 'Bearer ' + session.access_token, Accept: 'application/json' },
    });
    if (!response.ok) return json({ error: 'Google Drive could not list these files. Reconnect and try again.' }, response.status === 401 ? 401 : 502);
    return json(await response.json());
  }

  return json({ error: 'Not found' }, 404);
}
