import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureMap132DriveFolder, ensureMap132CategoryFolder, uploadMap132DriveFile, downloadMap132DriveFile, deleteMap132DriveFile } from '../worker/googleDriveStorage.ts';

function memoryKv(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
    async delete(key) { values.delete(key); },
  };
}

test('creates and caches a dedicated MAP132 Workspace folder', async () => {
  const kv = memoryKv();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.match(String(url), /www\.googleapis\.com\/drive\/v3\/files/);
    assert.equal(init.method, 'POST');
    const body = JSON.parse(init.body);
    assert.equal(body.name, 'MAP132 Workspace');
    assert.equal(body.mimeType, 'application/vnd.google-apps.folder');
    return Response.json({ id: 'folder-123' });
  };
  try {
    assert.equal(await ensureMap132DriveFolder('access-token', kv), 'folder-123');
    assert.equal(await kv.get('my-drive/storage-folder-id'), 'folder-123');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('creates and caches category folders under MAP132 Workspace', async () => {
  const kv = memoryKv({ 'my-drive/storage-folder-id': 'folder-123' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (init.method !== 'POST') return Response.json({ id: 'folder-123', name: 'MAP132 Workspace', trashed: false });
    const body = JSON.parse(init.body);
    assert.equal(body.name, 'Sound Effects');
    assert.deepEqual(body.parents, ['folder-123']);
    return Response.json({ id: 'sfx-folder' });
  };
  try {
    assert.equal(await ensureMap132CategoryFolder('access-token', kv, 'Sound Effects'), 'sfx-folder');
    assert.equal(await kv.get('my-drive/category-folder-id/Sound%20Effects'), 'sfx-folder');
  } finally { globalThis.fetch = originalFetch; }
});

test('uploads resource bytes into the selected category through a resumable Drive upload session', async () => {
  const kv = memoryKv({ 'my-drive/storage-folder-id': 'folder-123' });
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) return Response.json({ id: 'folder-123', name: 'MAP132 Workspace', trashed: false });
    if (calls.length === 2) {
      const folder = JSON.parse(init.body);
      assert.equal(folder.name, 'Fonts');
      assert.deepEqual(folder.parents, ['folder-123']);
      return Response.json({ id: 'category-fonts' });
    }
    if (calls.length === 3) {
      assert.match(String(url), /uploadType=resumable/);
      assert.equal(init.method, 'POST');
      const metadata = JSON.parse(init.body);
      assert.deepEqual(metadata.parents, ['category-fonts']);
      assert.equal(metadata.name, 'sample.ttf');
      assert.equal(init.headers['X-Upload-Content-Length'], '10');
      return new Response(null, { status: 200, headers: { Location: 'https://upload.example/session/abc' } });
    }
    assert.equal(String(url), 'https://upload.example/session/abc');
    assert.equal(init.method, 'PUT');
    assert.equal(init.headers['Content-Type'], 'font/ttf');
    assert.equal(await new Response(init.body).text(), 'font-bytes');
    return Response.json({ id: 'drive-file-456', name: 'sample.ttf', mimeType: 'font/ttf', size: '10', parents: ['category-fonts'] });
  };
  try {
    const result = await uploadMap132DriveFile('access-token', kv, 'sample.ttf', 'font/ttf', new TextEncoder().encode('font-bytes').buffer, 'Fonts');
    assert.equal(result.id, 'drive-file-456');
    assert.equal(calls.length, 4);
  } finally { globalThis.fetch = originalFetch; }
});

test('rejects resumable upload sessions without a Location header', async () => {
  const kv = memoryKv({ 'my-drive/storage-folder-id': 'folder-123' });
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    if (calls === 1) return Response.json({ id: 'folder-123', name: 'MAP132 Workspace', trashed: false });
    if (calls === 2) return Response.json({ id: 'category-other' });
    return new Response(null, { status: 200 });
  };
  try {
    await assert.rejects(
      uploadMap132DriveFile('access-token', kv, 'sample.ttf', 'font/ttf', new TextEncoder().encode('font').buffer),
      /did not return a resumable upload URL/
    );
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

test('does not report a failed Drive delete as successful', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 403 });
  try { assert.equal(await deleteMap132DriveFile('access-token', 'file-denied'), false); }
  finally { globalThis.fetch = originalFetch; }
});

test('treats an already-missing Drive file as deleted', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 404 });
  try { assert.equal(await deleteMap132DriveFile('access-token', 'file-gone'), true); }
  finally { globalThis.fetch = originalFetch; }
});
