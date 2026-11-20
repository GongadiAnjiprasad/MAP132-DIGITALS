import test from 'node:test';
import assert from 'node:assert/strict';
import { syncDrivePortfolioFromFolder } from '../worker/drivePortfolioCron.ts';

function makeKv(initial) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    values, writes,
    async get(key) { return values.has(key) ? values.get(key) : null; },
    async put(key, value) { writes.push({ key, value }); values.set(key, value); },
  };
}

test('scheduled sync recursively discovers videos and only replaces records from the selected folder', async t => {
  const kv = makeKv({
    'my-drive/portfolio-folder': JSON.stringify({ id: 'root', name: 'MAP132 portfolio' }),
    'portfolio/content': JSON.stringify({
      profile: { name: 'MAP132 DIGITALS' },
      items: [
        { id: 'old-selected', kind: 'video', source: 'drive', driveFileId: 'old-video', driveFolderId: 'root' },
        { id: 'other-folder-video', kind: 'video', source: 'drive', driveFileId: 'other-video', driveFolderId: 'other-root' },
        { id: 'manual-project', kind: 'image', title: 'Manual project' },
      ],
    }),
  });
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    const parent = url.searchParams.get('q')?.match(/^'([^']+)' in parents/)?.[1];
    if (parent === 'root') return Response.json({ files: [
      { id: 'wedding-folder', name: 'Wedding', mimeType: 'application/vnd.google-apps.folder' },
      { id: 'video-one', name: 'My First Edit.mp4', mimeType: 'video/mp4', size: '500' },
      { id: 'image-one', name: 'cover.jpg', mimeType: 'image/jpeg' },
    ] });
    if (parent === 'wedding-folder') return Response.json({ files: [
      { id: 'video-two', name: 'Pelli Highlights.mp4', mimeType: 'video/mp4', size: '700' },
    ] });
    throw new Error('Unexpected Drive parent query: ' + parent);
  });

  const result = await syncDrivePortfolioFromFolder({ MAP132_KV: kv }, async () => 'mock-access-token');
  assert.equal(result.published, 2);
  assert.equal(result.removed, 1);
  assert.equal(result.scanned, 4);
  const content = JSON.parse(kv.values.get('portfolio/content'));
  assert.equal(content.profile.name, 'MAP132 DIGITALS');
  assert.deepEqual(content.items.map(item => item.driveFileId).filter(Boolean).sort(), ['other-video', 'video-one', 'video-two']);
  assert.ok(content.items.some(item => item.id === 'manual-project'));
  assert.ok(content.items.some(item => item.driveFileId === 'video-two' && item.category === 'Wedding & Events'));
  assert.equal(kv.writes.length, 1);
});

test('Drive scan failure preserves the currently published portfolio content', async t => {
  const original = JSON.stringify({ items: [{ id: 'known-good', title: 'Keep me' }] });
  const kv = makeKv({
    'my-drive/portfolio-folder': JSON.stringify({ id: 'root', name: 'MAP132 portfolio' }),
    'portfolio/content': original,
  });
  t.mock.method(globalThis, 'fetch', async () => new Response('Drive unavailable', { status: 503 }));
  await assert.rejects(syncDrivePortfolioFromFolder({ MAP132_KV: kv }, async () => 'mock-access-token'), /existing portfolio items were kept/);
  assert.equal(kv.values.get('portfolio/content'), original);
  assert.equal(kv.writes.length, 0);
});

test('missing OAuth refresh access preserves the currently published portfolio content', async () => {
  const original = JSON.stringify({ items: [{ id: 'known-good', title: 'Keep me' }] });
  const kv = makeKv({
    'my-drive/portfolio-folder': JSON.stringify({ id: 'root', name: 'MAP132 portfolio' }),
    'portfolio/content': original,
  });
  await assert.rejects(syncDrivePortfolioFromFolder({ MAP132_KV: kv }, async () => null), /existing portfolio items were kept/);
  assert.equal(kv.values.get('portfolio/content'), original);
  assert.equal(kv.writes.length, 0);
});
