import { uploadMap132DriveFile } from '../../../worker/googleDriveStorage.ts';
interface DriveEnv {
  MAP132_KV?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MY_DRIVE_SESSION_SECRET?: string;
  GOOGLE_PICKER_API_KEY?: string;
  MAP132_MEDIA?: R2Bucket;
  ADMIN_PASSWORD?: string;
}

const COOKIE = 'map132_drive_session';
const STATE_TTL = 600;
const SESSION_TTL = 3500;
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'];
const REFRESH_TOKEN_KEY = 'my-drive/google-refresh-token';
const SESSION_RECORD_TTL = 60 * 60 * 24 * 30;
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
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
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
  if (!item) return null;
  try { return decodeURIComponent(item.slice(COOKIE.length + 1)); } catch { return null; }
}

function sessionCookie(value: string, maxAge: number): string {
  return COOKIE + '=' + encodeURIComponent(value) +
    '; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive; Max-Age=' + maxAge;
}

function clearCookie(): string {
  return COOKIE + '=; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive; Max-Age=0';
}

function lockConfigReady(env: DriveEnv): boolean {
  return Boolean(env.MAP132_KV && env.MY_DRIVE_SESSION_SECRET && env.MY_DRIVE_SESSION_SECRET.length >= 32);
}

function configReady(env: DriveEnv): boolean {
  return Boolean(lockConfigReady(env) && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

async function readSession(request: Request, env: DriveEnv): Promise<{ access_token: string; expires_at: number } | null> {
  const id = cookieValue(request);
  if (!id || !env.MAP132_KV || !env.MY_DRIVE_SESSION_SECRET) return null;
  const key = 'my-drive/session/' + id;
  const stored = await env.MAP132_KV.get(key);
  if (!stored) return null;
  try {
    let session = await decrypt<{ access_token: string; expires_at: number }>(stored, env.MY_DRIVE_SESSION_SECRET);
    if (session.expires_at > Date.now() + 60_000) return session;
    const encryptedRefresh = await env.MAP132_KV.get(REFRESH_TOKEN_KEY);
    if (!encryptedRefresh || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
    const refresh = await decrypt<{ refresh_token: string }>(encryptedRefresh, env.MY_DRIVE_SESSION_SECRET);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: refresh.refresh_token, grant_type: 'refresh_token' }),
    });
    if (!response.ok) return null;
    const token = await response.json() as { access_token?: string; expires_in?: number };
    if (!token.access_token) return null;
    const expiresAt = Date.now() + Math.max(60, Number(token.expires_in || SESSION_TTL)) * 1000;
    session = { access_token: token.access_token, expires_at: expiresAt };
    await env.MAP132_KV.put(key, await encrypt(session, env.MY_DRIVE_SESSION_SECRET), { expirationTtl: SESSION_RECORD_TTL });
    return session;
  } catch {
    await env.MAP132_KV.delete(key);
    return null;
  }
}
export async function getMyDriveAccessToken(request: Request, env: DriveEnv): Promise<string | null> {
  const session = await readSession(request, env);
  return session?.access_token || null;
}



const OAUTH_STATE_COOKIE = 'map132_drive_oauth_state';
function oauthStateCookie(value: string): string {
  return OAUTH_STATE_COOKIE + '=' + encodeURIComponent(value) + '; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive/oauth/callback; Max-Age=' + STATE_TTL;
}
function clearOAuthStateCookie(): string {
  return OAUTH_STATE_COOKIE + '=; HttpOnly; Secure; SameSite=Lax; Path=/api/my-drive/oauth/callback; Max-Age=0';
}

function readCookie(request: Request, name: string): string | null {
  const item = (request.headers.get('Cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  if (!item) return null;
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return null; }
}

async function hasAdminSession(request: Request, env: DriveEnv): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false;
  const raw = readCookie(request, 'map132_admin');
  if (!raw) return false;
  const parts = raw.split('.');
  if (parts.length !== 2) return false;
  try {
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return false;
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.ADMIN_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(parts[0]))));
    return signature === parts[1];
  } catch { return false; }
}
export async function clearMyDriveSession(request: Request, env: DriveEnv): Promise<Headers> {
  const id = cookieValue(request);
  if (id && env.MAP132_KV) await env.MAP132_KV.delete('my-drive/session/' + id);
  const headers = new Headers();
  headers.append('Set-Cookie', clearCookie());
  return headers;
}

/** Handles the server-side, read-only Google Drive OAuth and listing endpoints. */
export async function handleMyDriveOAuth(request: Request, env: DriveEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/my-drive/')) return null;

  if (!configReady(env)) {
    return json({ error: 'Google Drive connection is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MY_DRIVE_SESSION_SECRET and the MAP132_KV binding.' }, 503);
  }
  if (!await hasAdminSession(request, env)) return json({ error: 'MAP132 Admin login required. Sign in to the Admin Dashboard to access My Drive.' }, 401);
  if (path === '/api/my-drive/logout' && request.method === 'POST') {
    return json({ signedOut: true }, 200, { 'Set-Cookie': (await clearMyDriveSession(request, env)).get('Set-Cookie') || clearCookie() });
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
    authorize.searchParams.set('scope', DRIVE_SCOPES.join(' '));
    authorize.searchParams.set('access_type', 'offline');
    authorize.searchParams.set('prompt', 'consent');
    authorize.searchParams.set('include_granted_scopes', 'true');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    return json({ authorizationUrl: authorize.toString(), redirectUri }, 200, { 'Set-Cookie': oauthStateCookie(state) });
  }

  if (path === '/api/my-drive/oauth/callback' && request.method === 'GET') {
    if (url.searchParams.has('error')) {
      const response = Response.redirect(new URL('/workspace.html?myDrive=cancelled', url.origin), 302);
      response.headers.append('Set-Cookie', clearOAuthStateCookie());
      return response;
    }
    const state = url.searchParams.get('state') || '';
    const code = url.searchParams.get('code') || '';
    const verifier = state && readCookie(request, OAUTH_STATE_COOKIE) === state ? await env.MAP132_KV!.get('my-drive/oauth-state/' + state) : null;
    if (!verifier || !code) return json({ error: 'OAuth state expired or does not match this browser session. Start again.' }, 400, { 'Set-Cookie': clearOAuthStateCookie() });
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
    if (!tokenResponse.ok) {
      const providerFailure = await tokenResponse.json().catch(() => ({})) as { error?: unknown; error_description?: unknown };
      const providerError = String(providerFailure.error || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'unknown';
      const providerDescription = String(providerFailure.error_description || '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
      const detail = providerDescription ? ': ' + providerDescription : '';
      return json({ error: 'Google token exchange failed (' + providerError + ')' + detail + '. Check OAuth client settings and callback URL.' }, 502);
    }
    const token = await tokenResponse.json() as { access_token?: string; expires_in?: number; scope?: string; refresh_token?: string };
    const grantedScopes = String(token.scope || '').split(' ');
    if (!token.access_token || !DRIVE_SCOPES.every(scope => grantedScopes.includes(scope))) {
      return json({ error: 'Google did not grant the required Drive read and app-file permissions. Reconnect and approve both.' }, 403);
    }
    if (token.refresh_token) await env.MAP132_KV!.put(REFRESH_TOKEN_KEY, await encrypt({ refresh_token: token.refresh_token }, env.MY_DRIVE_SESSION_SECRET!));
    const sessionId = randomToken();
    const expiresAt = Date.now() + Math.min(Number(token.expires_in || SESSION_TTL), SESSION_TTL) * 1000;
    const encrypted = await encrypt({ access_token: token.access_token, expires_at: expiresAt }, env.MY_DRIVE_SESSION_SECRET!);
    await env.MAP132_KV!.put('my-drive/session/' + sessionId, encrypted, {
      expirationTtl: SESSION_RECORD_TTL,
    });
    const headers = new Headers({
      Location: new URL('/workspace.html?myDrive=connected', url.origin).toString(),
      'Cache-Control': 'no-store',
    });
    headers.append('Set-Cookie', sessionCookie(sessionId, SESSION_RECORD_TTL));
    headers.append('Set-Cookie', clearOAuthStateCookie());
    return new Response(null, { status: 302, headers });
  }


  if (path === '/api/my-drive/picker-config' && request.method === 'GET') {
    const session = await readSession(request, env);
    if (!session) return json({ error: 'Connect Google Drive again to continue.' }, 401);
    return json({
      accessToken: session.access_token,
      developerKey: env.GOOGLE_PICKER_API_KEY || '',
      appId: '101648327950',
      pickerEnabled: Boolean(env.GOOGLE_PICKER_API_KEY),
    });
  }

  if (path === '/api/my-drive/import-folder' && request.method === 'POST') {
    const session = await readSession(request, env);
    if (!session) return json({ error: 'Connect Google Drive again to continue.' }, 401);
    const body = await request.json().catch(() => ({})) as { folderId?: string };
    const rootId = String(body.folderId || '');
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(rootId)) return json({ error: 'Choose a valid Google Drive folder.' }, 400);
    const headers = { Authorization: 'Bearer ' + session.access_token, Accept: 'application/json' };
    const folders = [rootId];
    const seenFolders = new Set<string>();
    const fontExtensions = new Set(['ttf', 'otf', 'woff', 'woff2']);
    const imported: Array<{ name: string; size: number }> = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    let totalBytes = 0;
    let scanned = 0;
    while (folders.length && seenFolders.size < 500 && scanned < 1500 && imported.length < 500) {
      const parentId = folders.shift()!;
      if (seenFolders.has(parentId)) continue;
      seenFolders.add(parentId);
      let pageToken = '';
      do {
        const listUrl = new URL('https://www.googleapis.com/drive/v3/files');
        listUrl.searchParams.set('q', "'" + parentId + "' in parents and trashed = false");
        listUrl.searchParams.set('pageSize', '100');
        listUrl.searchParams.set('orderBy', 'folder,name');
        listUrl.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size)');
        if (pageToken) listUrl.searchParams.set('pageToken', pageToken);
        const listResponse = await fetch(listUrl, { headers });
        if (!listResponse.ok) return json({ error: 'Google Drive folder scan failed. Reconnect and retry.' }, listResponse.status === 401 ? 401 : 502);
        const page = await listResponse.json() as { nextPageToken?: string; files?: Array<{ id: string; name: string; mimeType: string; size?: string }> };
        for (const file of page.files || []) {
          scanned++;
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            if (!seenFolders.has(file.id) && folders.length + seenFolders.size < 500) folders.push(file.id);
            continue;
          }
          const ext = String(file.name || '').split('.').pop()?.toLowerCase() || '';
          if (!fontExtensions.has(ext)) continue;
          const size = Number(file.size || 0);
          if (!Number.isFinite(size) || size <= 0 || size > 25 * 1024 * 1024 || totalBytes + size > 250 * 1024 * 1024) {
            skipped.push({ name: file.name, reason: 'File exceeds the per-font or total folder import limit.' });
            continue;
          }
          const downloadUrl = new URL('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(file.id));
          downloadUrl.searchParams.set('alt', 'media');
          const download = await fetch(downloadUrl, { headers: { Authorization: 'Bearer ' + session.access_token, Accept: '*/*' } });
          if (!download.ok || !download.body) {
            skipped.push({ name: file.name, reason: 'Google Drive could not download this font.' });
            continue;
          }
          const bytes = await download.arrayBuffer();
          if (!bytes.byteLength || bytes.byteLength > 25 * 1024 * 1024 || totalBytes + bytes.byteLength > 250 * 1024 * 1024) {
            skipped.push({ name: file.name, reason: 'Downloaded file exceeds the import limit.' });
            continue;
          }
          const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
          const sha = [...digest].map(value => value.toString(16).padStart(2, '0')).join('');
          const id = crypto.randomUUID();
          const key = 'my-drive/assets/' + id;
          const contentType = ext === 'woff' ? 'font/woff' : ext === 'woff2' ? 'font/woff2' : ext === 'otf' ? 'font/otf' : 'font/ttf';
          const asset = { id, name: file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'font.' + ext, kind: 'font', size: bytes.byteLength, sha256: sha, contentType, storedAt: new Date().toISOString(), licenseStatus: 'unverified', source: 'google-drive-import', originalDriveFileId: file.id };
          const driveFile = await uploadMap132DriveFile(session.access_token, env.MAP132_KV!, asset.name, contentType, bytes);
          (asset as typeof asset & { driveFileId?: string }).driveFileId = driveFile.id;
          await env.MAP132_KV!.put(key, JSON.stringify(asset));
          totalBytes += bytes.byteLength;
          imported.push({ name: asset.name, size: bytes.byteLength });
          if (imported.length >= 500) break;
        }
        pageToken = page.nextPageToken || '';
      } while (pageToken && scanned < 1500 && imported.length < 500);
    }
    return json({ importedCount: imported.length, skippedCount: skipped.length, scannedCount: scanned, totalBytes, imported, skipped, limits: { folders: 500, files: 1500, fonts: 500, totalBytes: 250 * 1024 * 1024 } });
  }

  if (path === '/api/my-drive/session' && request.method === 'GET') {
    const session = await readSession(request, env);
    return json({ connected: Boolean(session), expiresAt: session?.expires_at ?? null });
  }




  if (path.startsWith('/api/my-drive/download/') && request.method === 'GET') {
    const fileId = path.slice('/api/my-drive/download/'.length);
    if (!/^[a-zA-Z0-9_-]{1,256}$/.test(fileId)) return json({ error: 'Invalid Google Drive file ID.' }, 400);
    const session = await readSession(request, env);
    if (!session) return json({ error: 'Connect Google Drive again to continue.' }, 401);
    const authHeaders = { Authorization: 'Bearer ' + session.access_token, Accept: 'application/json' };
    const metadataUrl = new URL('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId));
    metadataUrl.searchParams.set('fields', 'id,name,mimeType,size');
    const metadataResponse = await fetch(metadataUrl, { headers: authHeaders });
    if (!metadataResponse.ok) return json({ error: 'Could not verify the selected Drive file.' }, metadataResponse.status === 401 ? 401 : 502);
    const metadata = await metadataResponse.json() as { name?: string; mimeType?: string; size?: string };
    const name = String(metadata.name || '');
    const extension = name.split('.').pop()?.toLowerCase() || '';
    const supported = new Set(['ttf','otf','woff','woff2','mp3','wav','aac','m4a','ogg','flac','mp4','webm','mov','m4v','jpg','jpeg','png','webp','gif','avif','svg','zip','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm']);
    if (!supported.has(extension)) return json({ error: 'This file type is not supported for MAP132 Workspace import.' }, 415);
    const size = Number(metadata.size || 0);
    const maxBytes = extension === 'zip' ? 300 * 1024 * 1024 : 100 * 1024 * 1024;
    if (!Number.isFinite(size) || size < 0 || size > maxBytes) return json({ error: 'The selected file exceeds its import size limit.' }, 413);
    const downloadUrl = new URL('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId));
    downloadUrl.searchParams.set('alt', 'media');
    const response = await fetch(downloadUrl, { headers: { Authorization: 'Bearer ' + session.access_token, Accept: '*/*' } });
    if (!response.ok || !response.body) return json({ error: 'Google Drive could not download this file.' }, response.status === 401 ? 401 : 502);
    return new Response(response.body, { headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'attachment; filename="' + name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) + '"' } });
  }

  if (path === '/api/my-drive/files' && request.method === 'GET') {
    const session = await readSession(request, env);
    if (!session) return json({ error: 'Connect Google Drive again to continue.' }, 401);
    const pageToken = url.searchParams.get('pageToken');
    const parentId = url.searchParams.get('parentId');
    if (pageToken && pageToken.length > 4096) return json({ error: 'Invalid Drive page token.' }, 400);
    if (parentId && !/^[a-zA-Z0-9_-]{1,256}$/.test(parentId)) return json({ error: 'Invalid Drive folder ID.' }, 400);
    const query = ["trashed = false", parentId ? "'" + parentId + "' in parents" : null]
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
