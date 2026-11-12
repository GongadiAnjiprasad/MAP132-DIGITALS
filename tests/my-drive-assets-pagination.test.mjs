import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { handleMyDriveAssets } from '../worker/myDriveAssets.ts';

globalThis.crypto ??= webcrypto;

const SESSION_SECRET = 'test-only-my-drive-session-secret-32-bytes';
const ADMIN_PASSWORD = 'test-only-admin-password';

function memoryKv(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
    async delete(key) { values.delete(key); },
    async list({ prefix = '', limit = 1000, cursor } = {}) {
      const names = [...values.keys()].filter(name => name.startsWith(prefix)).sort();
      const offset = cursor ? Number(Buffer.from(cursor, 'base64url').toString('utf8')) : 0;
      const keys = names.slice(offset, offset + limit).map(name => ({ name }));
      const nextOffset = offset + keys.length;
      return { keys, cursor: nextOffset < names.length ? Buffer.from(String(nextOffset)).toString('base64url') : undefined };
    },
  };
}

function base64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function adminCookie(password = ADMIN_PASSWORD) {
  const payload = base64url(Buffer.from(JSON.stringify({ exp: Date.now() + 60 * 60 * 1000 })));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  return 'map132_admin=' + payload + '.' + base64url(signature);
}

async function encryptedSession(secret) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const session = { access_token: 'test-access-token', expires_at: Date.now() + 30 * 60 * 1000 };
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(session)));
  return Buffer.from(new Uint8Array([...iv, ...new Uint8Array(ciphertext)])).toString('base64url');
}

test('My Drive saved resources use the Admin session and Google Drive session, without a separate unlock cookie', async () => {
  const kv = memoryKv({
    'my-drive/session/session-id': await encryptedSession(SESSION_SECRET),
    'my-drive/assets/asset-1': JSON.stringify({ id: 'asset-1', name: 'first.ttf' }),
    'my-drive/assets/asset-2': JSON.stringify({ id: 'asset-2', name: 'second.ttf' }),
    'my-drive/assets/asset-3': JSON.stringify({ id: 'asset-3', name: 'third.ttf' }),
  });
  const env = { MAP132_KV: kv, MY_DRIVE_SESSION_SECRET: SESSION_SECRET, ADMIN_PASSWORD };
  const cookie = (await adminCookie()) + '; map132_drive_session=session-id';
  const first = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets?limit=2', { headers: { Cookie: cookie } }), env);
  assert.ok(first);
  assert.equal(first.status, 200);
  const firstPage = await first.json();
  assert.deepEqual(firstPage.assets.map(asset => asset.id), ['asset-1', 'asset-2']);
  assert.ok(firstPage.cursor);

  const second = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets?limit=2&cursor=' + encodeURIComponent(firstPage.cursor), { headers: { Cookie: cookie } }), env);
  assert.ok(second);
  assert.equal(second.status, 200);
  const secondPage = await second.json();
  assert.deepEqual(secondPage.assets.map(asset => asset.id), ['asset-3']);
  assert.equal(secondPage.cursor, null);
});

test('A legacy My Drive unlock cookie cannot replace a valid Admin session', async () => {
  const kv = memoryKv({
    'my-drive/unlock/old-unlock-id': 'unlocked',
    'my-drive/session/session-id': await encryptedSession(SESSION_SECRET),
  });
  const env = { MAP132_KV: kv, MY_DRIVE_SESSION_SECRET: SESSION_SECRET, ADMIN_PASSWORD };
  const response = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets', {
    headers: { Cookie: 'map132_drive_unlock=old-unlock-id; map132_drive_session=session-id' },
  }), env);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'MAP132 Admin login required.' });
});

test('A valid Admin session without Google Drive connection receives a reconnect response', async () => {
  const env = { MAP132_KV: memoryKv(), MY_DRIVE_SESSION_SECRET: SESSION_SECRET, ADMIN_PASSWORD };
  const response = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets', {
    headers: { Cookie: await adminCookie() },
  }), env);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Google Drive session expired. Reconnect Google Drive and try again.' });
});
