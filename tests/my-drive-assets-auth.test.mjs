import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMyDriveAssets } from '../worker/myDriveAssets.ts';

class MemoryKV {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

async function adminCookieWithBase64UrlCharacters(password) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  for (let exp = Date.now() + 60_000; exp < Date.now() + 120_000; exp += 1) {
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const signatureBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
    const standardBase64 = Buffer.from(signatureBytes).toString('base64');
    if (!/[+/]/.test(standardBase64)) continue;
    const signature = Buffer.from(signatureBytes).toString('base64url');
    return 'map132_admin=' + payload + '.' + signature;
  }
  throw new Error('Could not construct a signature requiring Base64URL character conversion.');
}

test('My Drive asset API accepts valid Admin signatures containing Base64URL substitutions', async () => {
  const password = 'map132-test-admin-password';
  const cookie = await adminCookieWithBase64UrlCharacters(password);
  const response = await handleMyDriveAssets(
    new Request('https://example.test/api/my-drive/assets', { headers: { Cookie: cookie } }),
    { ADMIN_PASSWORD: password, MAP132_KV: new MemoryKV() }
  );
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /Google Drive session expired/);
});
