import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureMap132DriveFolder, uploadMap132DriveFile, downloadMap132DriveFile, deleteMap132DriveFile } from '../worker/googleDriveStorage.ts';

function memoryKv(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
    async delete(key) { values.delete(key); },
  };
}

test('creates and caches a dedicated MAP132 Drive folder', async () => {
  const kv = memoryKv();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.match(String(url), /www.googleapis.com\/drive\/v3\/files/);
    assert.equal(init.method, 'POST');
    const body = JSON.parse(init.body);
    assert.equal(body.name, 'MAP132 DIGITALS Resources');
    assert.equal(body.mimeType, 'application/vnd.google-apps.folder');
    return Response.json({ id: 'folder-123' });
  };
  try {
    assert.equal(await ensureMap132DriveFolder('access-token', kv), 'folder-123');
    assert.equal(await kv.get('my-drive/storage-folder-id'), 'folder-123');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('uploads resource bytes into the dedicated Drive folder and returns the Drive file ID', async () => {
  const kv = memoryKv({ 'my-drive/storage-folder-id': 'folder-123' });
  const originalFetch = globalThis.fetch;
  let uploadSeen = false;
  globalThis.fetch = async (url, init) => {
    if (init.method === 'GET') return Response.json({ id: 'folder-123', trashed: false });
    assert.match(String(url), /uploadType=multipart/);
    assert.equal(init.method, 'POST');
    assert.ok(init.body instanceof FormData);
    const metadata = JSON.parse(await init.body.get('metadata').text());
    assert.deepEqual(metadata.parents, ['folder-123']);
    assert.equal(metadata.name, 'sample.ttf');
    assert.equal(await init.body.get('file').text(), 'font-bytes');
    uploadSeen = true;
    return Response.json({ id: 'drive-file-456', name: 'sample.ttf', mimeType: 'font/ttf', size: '10', parents: ['folder-123'] });
  };
  try {
    const result = await uploadMap132DriveFile('access-token', kv, 'sample.ttf', 'font/ttf', new TextEncoder().encode('font-bytes').buffer);
    assert.equal(result.id, 'drive-file-456');
    assert.equal(uploadSeen, true);
  } finally { globalThis.fetch = originalFetch; }
});

test('downloads and deletes only the stored Drive file ID', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method });
    return init.method === 'DELETE' ? new Response(null, { status: 204 }) : new Response('file-bytes');
  };
  try {
    const download = await downloadMap132DriveFile('access-token', 'file-789');
    assert.equal(await download.text(), 'file-bytes');
    assert.equal(await deleteMap132DriveFile('access-token', 'file-789'), true);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.url.includes('/files/file-789')));
  } finally { globalThis.fetch = originalFetch; }
});
