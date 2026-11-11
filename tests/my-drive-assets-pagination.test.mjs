import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { handleMyDriveAssets } from '../worker/myDriveAssets.ts';

globalThis.crypto ??= webcrypto;

const SESSION_SECRET = 'test-only-my-drive-session-secret-32-bytes';
const COOKIE = 'map132_drive_unlock=unlock-id; map132_drive_session=session-id';

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

async function encryptedSession(secret) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const session = { access_token: 'test-access-token', expires_at: Date.now() + 30 * 60 * 1000 };
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(session)));
  return Buffer.from(new Uint8Array([...iv, ...new Uint8Array(ciphertext)])).toString('base64url');
}

test('My Drive saved resources endpoint returns subsequent KV pages when cursor is supplied', async () => {
  const kv = memoryKv({
    'my-drive/unlock/unlock-id': 'unlocked',
    'my-drive/session/session-id': await encryptedSession(SESSION_SECRET),
    'my-drive/assets/asset-1': JSON.stringify({ id: 'asset-1', name: 'first.ttf' }),
    'my-drive/assets/asset-2': JSON.stringify({ id: 'asset-2', name: 'second.ttf' }),
    'my-drive/assets/asset-3': JSON.stringify({ id: 'asset-3', name: 'third.ttf' }),
  });
  const env = { MAP132_KV: kv, MY_DRIVE_SESSION_SECRET: SESSION_SECRET };
  const first = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets?limit=2', { headers: { Cookie: COOKIE } }), env);
  assert.ok(first);
  assert.equal(first.status, 200);
  const firstPage = await first.json();
  assert.deepEqual(firstPage.assets.map(asset => asset.id), ['asset-1', 'asset-2']);
  assert.ok(firstPage.cursor);

  const second = await handleMyDriveAssets(new Request('https://example.test/api/my-drive/assets?limit=2&cursor=' + encodeURIComponent(firstPage.cursor), { headers: { Cookie: COOKIE } }), env);
  assert.ok(second);
  assert.equal(second.status, 200);
  const secondPage = await second.json();
  assert.deepEqual(secondPage.assets.map(asset => asset.id), ['asset-3']);
  assert.equal(secondPage.cursor, null);
});
