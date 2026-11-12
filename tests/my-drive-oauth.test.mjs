import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMyDriveOAuth } from '../src/modules/my-drive-resource-manager/driveOAuth.ts';

class MemoryKV {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}
const secret = '0123456789abcdef0123456789abcdef';
const env = () => ({ MAP132_KV: new MemoryKV(), GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'test-client-secret', MY_DRIVE_SESSION_SECRET: secret, ADMIN_PASSWORD: 'test-admin-password', GOOGLE_PICKER_API_KEY: 'test-picker-key' });
function b64url(bytes) { return Buffer.from(bytes).toString('base64url'); }
async function adminCookie(password) {
  const payload = b64url(Buffer.from(JSON.stringify({ exp: Date.now() + 60_000 })));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))));
  return 'map132_admin=' + payload + '.' + sig;
}

test('OAuth start sets a browser-bound state cookie and PKCE challenge', async () => {
  const e = env();
  const cookie = await adminCookie(e.ADMIN_PASSWORD);
  const response = await handleMyDriveOAuth(new Request('https://example.test/api/my-drive/oauth/start', {
    method: 'POST', headers: { Cookie: cookie },
  }), e);
  assert.equal(response.status, 200);
  const data = await response.json();
  const auth = new URL(data.authorizationUrl);
  assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(auth.searchParams.get('code_challenge'));
  assert.ok(response.headers.get('Set-Cookie').includes('map132_drive_oauth_state='));
});

test('OAuth callback rejects a state cookie from a different browser session', async () => {
  const e = env();
  let called = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { called = true; return new Response('{}'); };
  try {
    const response = await handleMyDriveOAuth(new Request('https://example.test/api/my-drive/oauth/callback?code=abc&state=expected'), e);
    assert.equal(response.status, 400);
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('all My Drive routes require the active Admin Dashboard session', async () => {
  const e = env();
  const denied = await handleMyDriveOAuth(new Request('https://example.test/api/my-drive/oauth/start', { method: 'POST' }), e);
  assert.equal(denied.status, 401);
  assert.match((await denied.json()).error, /Admin login required/);
  const cookie = await adminCookie(e.ADMIN_PASSWORD);
  const allowed = await handleMyDriveOAuth(new Request('https://example.test/api/my-drive/oauth/start', {
    method: 'POST', headers: { Cookie: cookie },
  }), e);
  assert.equal(allowed.status, 200);
  assert.ok((await allowed.json()).authorizationUrl);
});

test('valid OAuth callback exchanges the code, encrypts the session and returns to workspace', async () => {
  const e = env();
  await e.MAP132_KV.put('my-drive/oauth-state/browser-state', 'pkce-verifier');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    access_token: 'short-lived-access-token',
    expires_in: 3600,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
    refresh_token: 'long-lived-refresh-token',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const response = await handleMyDriveOAuth(new Request('https://example.test/api/my-drive/oauth/callback?code=auth-code&state=browser-state', {
      headers: { Cookie: 'map132_drive_oauth_state=browser-state; ' + await adminCookie(e.ADMIN_PASSWORD) },
    }), e);
    assert.equal(response.status, 302);
    assert.match(response.headers.get('Location'), /\/workspace\.html\?myDrive=connected/);
    const sessionEntry = [...e.MAP132_KV.values.entries()].find(([key]) => key.startsWith('my-drive/session/'));
    assert.ok(sessionEntry);
    assert.doesNotMatch(sessionEntry[1], /short-lived-access-token/);
    assert.equal(await e.MAP132_KV.get('my-drive/oauth-state/browser-state'), null);
    const refreshEntry = await e.MAP132_KV.get('my-drive/google-refresh-token');
    assert.ok(refreshEntry);
    assert.doesNotMatch(refreshEntry, /long-lived-refresh-token/);
  } finally { globalThis.fetch = originalFetch; }
});
