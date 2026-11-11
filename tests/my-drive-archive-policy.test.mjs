import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVE_LIMITS,
  classifyAsset,
  getExtension,
  normalizeArchivePath,
  validateArchiveEntry,
} from '../src/modules/my-drive-resource-manager/archivePolicy.ts';

test('recognizes all four supported font formats case-insensitively', () => {
  for (const format of ['ttf', 'otf', 'woff', 'woff2']) {
    assert.deepEqual(classifyAsset('MyFont.' + format.toUpperCase()), {
      kind: 'font',
      fontFormat: format,
    });
  }
});

test('classifies common creative resource types without claiming licence status', () => {
  assert.equal(classifyAsset('impact.wav').kind, 'audio');
  assert.equal(classifyAsset('trailer.mp4').kind, 'video');
  assert.equal(classifyAsset('overlay.png').kind, 'image');
  assert.equal(classifyAsset('title.mogrt').kind, 'template');
  assert.equal(classifyAsset('film-look.cube').kind, 'texture');
  assert.equal(classifyAsset('unknown.bin').kind, 'other');
});

test('normalizes nested paths and rejects traversal or absolute paths', () => {
  assert.equal(normalizeArchivePath('Fonts/Telugu/MyFont.ttf'), 'Fonts/Telugu/MyFont.ttf');
  assert.equal(normalizeArchivePath('Fonts\\Telugu\\MyFont.ttf'), 'Fonts/Telugu/MyFont.ttf');
  assert.equal(normalizeArchivePath('../outside.ttf'), null);
  assert.equal(normalizeArchivePath('Fonts/../../outside.ttf'), null);
  assert.equal(normalizeArchivePath('/absolute/font.ttf'), null);
  assert.equal(normalizeArchivePath('C:\\Windows\\font.ttf'), null);
  assert.equal(normalizeArchivePath(''), null);
});

test('rejects encrypted entries, symlinks and unsupported compression methods', () => {
  const base = { path: 'Fonts/a.ttf', uncompressedSize: 100, compressedSize: 50, compressionMethod: 8 };
  assert.deepEqual(validateArchiveEntry({ ...base, encrypted: true }, { entries: 0, uncompressedBytes: 0 }), { accepted: false, reason: 'encrypted-entry' });
  assert.deepEqual(validateArchiveEntry({ ...base, symlink: true }, { entries: 0, uncompressedBytes: 0 }), { accepted: false, reason: 'symlink-entry' });
  assert.deepEqual(validateArchiveEntry({ ...base, compressionMethod: 99 }, { entries: 0, uncompressedBytes: 0 }), { accepted: false, reason: 'unsupported-compression' });
});

test('enforces entry count, per-file, total-size and compression-ratio limits', () => {
  const base = { path: 'Fonts/a.ttf', uncompressedSize: 100, compressedSize: 50, compressionMethod: 8 };
  assert.equal(validateArchiveEntry(base, { entries: ARCHIVE_LIMITS.maxEntries, uncompressedBytes: 0 }).reason, 'archive-limit-exceeded');
  assert.equal(validateArchiveEntry({ ...base, uncompressedSize: ARCHIVE_LIMITS.maxFileBytes + 1 }, { entries: 0, uncompressedBytes: 0 }).reason, 'archive-limit-exceeded');
  assert.equal(validateArchiveEntry(base, { entries: 0, uncompressedBytes: ARCHIVE_LIMITS.maxTotalUncompressedBytes }).reason, 'archive-limit-exceeded');
  assert.equal(validateArchiveEntry({ ...base, uncompressedSize: 10_001, compressedSize: 100 }, { entries: 0, uncompressedBytes: 0 }).reason, 'archive-limit-exceeded');
});

test('accepts stored and deflate entries within configured bounds', () => {
  for (const compressionMethod of [0, 8]) {
    assert.equal(validateArchiveEntry(
      { path: 'Fonts/Telugu/a.ttf', uncompressedSize: 1024, compressedSize: 512, compressionMethod },
      { entries: 0, uncompressedBytes: 0 },
    ).accepted, true);
  }
});

test('extracts extension from a nested file name', () => {
  assert.equal(getExtension('My Drive/Fonts/Anji.TTF'), 'ttf');
});
