import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importZip } from '../src/modules/my-drive-resource-manager/zipImporter.ts';
import { listDriveFolderRecursively } from '../src/modules/my-drive-resource-manager/driveClient.ts';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(view, offset, value) { view.setUint16(offset, value, true); }
function u32(view, offset, value) { view.setUint32(offset, value, true); }
function makeStoredZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [], centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name), data = encoder.encode(entry.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0); u16(lv, 8, 0);
    u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length);
    u16(lv, 26, name.length); u16(lv, 28, 0); local.set(name, 30); local.set(data, 30 + name.length);
    localParts.push(local);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0); u16(cv, 10, 0);
    u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length);
    u16(cv, 28, name.length); u16(cv, 30, 0); u16(cv, 32, 0); u32(cv, 38, 0); u32(cv, 42, offset);
    central.set(name, 46); centralParts.push(central); offset += local.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, entries.length); u16(ev, 10, entries.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  return new Uint8Array([...localParts.flatMap(x => [...x]), ...centralParts.flatMap(x => [...x]), ...end]);
}

test('imports nested supported fonts from a ZIP and computes SHA-256 hashes', async () => {
  const zip = new File([makeStoredZip([{ name: 'Fonts/Telugu/Anji.ttf', content: 'font-binary-test' }])], 'fonts.zip');
  const result = await importZip(zip);
  assert.equal(result.summary.imported, 1);
  assert.equal(result.assets[0].candidate.relativePath, 'Fonts/Telugu/Anji.ttf');
  assert.equal(result.assets[0].candidate.fontFormat, 'ttf');
  assert.match(result.assets[0].candidate.contentSha256, /^[a-f0-9]{64}$/);
  assert.equal(result.assets[0].candidate.licence, 'unknown');
});

test('skips unsafe ZIP paths and duplicate content', async () => {
  const zip = new File([makeStoredZip([
    { name: '../outside.ttf', content: 'unsafe' },
    { name: 'Fonts/first.otf', content: 'same-font' },
    { name: 'Fonts/copy.otf', content: 'same-font' },
  ])], 'mixed.zip');
  const result = await importZip(zip);
  assert.equal(result.assets.length, 1);
  assert.equal(result.summary.duplicates, 1);
  assert.ok(result.summary.issues.some(issue => issue.code === 'unsafe-path'));
});

test('rejects ZIP data without a valid end-of-central-directory record', async () => {
  const file = new File([new Uint8Array([1, 2, 3, 4])], 'broken.zip');
  await assert.rejects(() => importZip(file), /central directory/i);
});

test('recursively scans nested Drive folders and skips unsupported files', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.window = { location: { origin: 'https://map132.example' } };
  const calls = [];
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    calls.push(url.searchParams.get('parentId'));
    const parent = url.searchParams.get('parentId');
    const payload = parent === 'root'
      ? { files: [{ id: 'nested', name: 'Fonts', mimeType: 'application/vnd.google-apps.folder' }, { id: 'bad', name: 'notes.txt', mimeType: 'text/plain' }] }
      : { files: [{ id: 'font', name: 'Anji.woff2', mimeType: 'font/woff2', size: '2048' }] };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const result = await listDriveFolderRecursively({ id: 'root', name: 'My Library' });
    assert.equal(result.candidates.length, 1);
    assert.equal(result.candidates[0].fontFormat, 'woff2');
    assert.equal(result.candidates[0].driveFileId, 'font');
    assert.equal(result.candidates[0].relativePath, 'My Library/Fonts/Anji.woff2');
    assert.ok(result.issues.some(issue => issue.code === 'unsupported-file'));
    assert.deepEqual(calls, ['root', 'nested']);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.window;
  }
});

test('rejects a ZIP whose central directory size excludes its entry metadata', async () => {
  const bytes = makeStoredZip([{ name: 'Fonts/Anji.ttf', content: 'font-data' }]);
  const view = new DataView(bytes.buffer);
  view.setUint32(bytes.byteLength - 22 + 12, 1, true);
  const result = await importZip(new File([bytes], 'truncated-directory.zip'));
  assert.equal(result.summary.imported, 0);
  assert.ok(result.summary.issues.some(issue => issue.code === 'corrupt-archive'));
});

test('rejects ZIP entries whose local header filename differs from the central directory', async () => {
  const bytes = makeStoredZip([{ name: 'Fonts/Anji.ttf', content: 'font-data' }]);
  bytes[30] = 'X'.charCodeAt(0);
  const result = await importZip(new File([bytes], 'mismatched-name.zip'));
  assert.equal(result.summary.imported, 0);
  assert.ok(result.summary.issues.some(issue => issue.code === 'corrupt-archive'));
});

test('Google Drive folder imports use separate bounded requests per file instead of one long Worker invocation', () => {
  const component = readFileSync(new URL('../src/modules/my-drive-resource-manager/MyDriveFolderImport.tsx', import.meta.url), 'utf8');
  assert.ok(component.includes('listDriveFolderRecursively'));
  assert.ok(component.includes('downloadDriveFile(font.driveFileId!'));
  assert.ok(component.includes("fetch('/api/my-drive/assets'"));
  assert.doesNotMatch(component, /fetch\('\/api\/my-drive\/import-folder'/);
});
