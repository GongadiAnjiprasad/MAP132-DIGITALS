import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSupportedFontsFromZip } from '../src/modules/my-drive-resource-manager/zipFontImport.ts';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content || '');
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, localOffset, true);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, localOffset, true);
  const all = [...localParts, ...centralParts, eocd];
  const result = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of all) { result.set(part, offset); offset += part.length; }
  return new File([result], 'fonts.zip', { type: 'application/zip' });
}

test('extracts supported font files from nested ZIP paths and ignores other files', async () => {
  const zip = makeZip([
    { name: 'Telugu/TTF/sample.ttf', content: 'font-data' },
    { name: 'Telugu/Web/sample.woff2', content: 'woff-data' },
    { name: 'Telugu/readme.txt', content: 'ignore-me' },
  ]);
  const files = await extractSupportedFontsFromZip(zip);
  assert.deepEqual(files.map(file => file.name), ['sample.ttf', 'sample.woff2']);
  assert.equal(await files[0].text(), 'font-data');
});

test('rejects a ZIP whose font bytes fail CRC integrity validation', async () => {
  const zip = makeZip([{ name: 'broken.ttf', content: 'font-data' }]);
  const bytes = new Uint8Array(await zip.arrayBuffer());
  bytes[31] ^= 0xff;
  await assert.rejects(
    () => extractSupportedFontsFromZip(new File([bytes], 'broken.zip')),
    /CRC integrity check/
  );
});

test('rejects malformed ZIP archives', async () => {
  await assert.rejects(
    () => extractSupportedFontsFromZip(new File(['not a zip'], 'bad.zip')),
    /directory is missing or invalid/
  );
});

test('skips traversal paths rather than extracting them', async () => {
  const zip = makeZip([{ name: '../outside.ttf', content: 'unsafe' }, { name: 'safe.ttf', content: 'safe' }]);
  const files = await extractSupportedFontsFromZip(zip);
  assert.deepEqual(files.map(file => file.name), ['safe.ttf']);
});
