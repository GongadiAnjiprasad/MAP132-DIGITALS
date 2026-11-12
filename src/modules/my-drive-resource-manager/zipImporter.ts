import { ARCHIVE_LIMITS, classifyAsset, validateArchiveEntry } from './archivePolicy.ts';
import type { ImportCandidate, ImportIssue, ImportSummary } from './types';
import { classifyResource } from './driveClient';

const decoder = new TextDecoder();
const readU16 = (view: DataView, offset: number) => view.getUint16(offset, true);
const readU32 = (view: DataView, offset: number) => view.getUint32(offset, true);

function findEndRecord(view: DataView): number {
  const min = Math.max(0, view.byteLength - 22 - 65_535);
  for (let offset = view.byteLength - 22; offset >= min; offset--) {
    if (readU32(view, offset) === 0x06054b50) return offset;
  }
  throw new Error('ZIP central directory is missing or corrupt.');
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support safe ZIP decompression.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export interface ImportedAsset {
  candidate: ImportCandidate;
  bytes: Uint8Array;
}

export async function importZip(
  file: File,
  sourceKind: 'local-zip' | 'google-drive-zip' = 'local-zip',
  sourceId = file.name,
  depth = 0,
  budget: { entries: number; uncompressedBytes: number } = { entries: 0, uncompressedBytes: 0 },
): Promise<{ assets: ImportedAsset[]; summary: ImportSummary }> {
  if (depth > 4) throw new Error('Nested ZIP depth exceeds the safe limit of 4 levels.');
  const issues: ImportIssue[] = [];
  const assets: ImportedAsset[] = [];
  const seen = new Set<string>();
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const end = findEndRecord(view);
  if (end + 22 > view.byteLength) throw new Error('ZIP end record is truncated.');
  const disk = readU16(view, end + 4);
  const centralDisk = readU16(view, end + 6);
  const diskEntries = readU16(view, end + 8);
  const totalEntries = readU16(view, end + 10);
  const centralSize = readU32(view, end + 12);
  const centralOffset = readU32(view, end + 16);
  const commentLength = readU16(view, end + 20);
  if (disk || centralDisk || diskEntries !== totalEntries || totalEntries === 0xffff || centralOffset + centralSize > end || end + 22 + commentLength > view.byteLength) {
    throw new Error('Multi-disk and ZIP64 archives are not supported.');
  }
  if (totalEntries > ARCHIVE_LIMITS.maxEntries) throw new Error('ZIP contains too many entries.');
  const centralEnd = centralOffset + centralSize;
  let cursor = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < totalEntries; index++) {
    if (cursor + 46 > centralEnd || readU32(view, cursor) !== 0x02014b50) {
      issues.push({ sourceName: file.name, code: 'corrupt-archive', message: 'ZIP central directory entry is corrupt.' });
      break;
    }
    const madeBy = readU16(view, cursor + 4);
    const flags = readU16(view, cursor + 8);
    const method = readU16(view, cursor + 10);
    const expectedCrc = readU32(view, cursor + 16);
    const compressedSize = readU32(view, cursor + 20);
    const uncompressedSize = readU32(view, cursor + 24);
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const entryCommentLength = readU16(view, cursor + 32);
    const externalAttributes = readU32(view, cursor + 38);
    const localOffset = readU32(view, cursor + 42);
    const nameStart = cursor + 46;
    const next = nameStart + nameLength + extraLength + entryCommentLength;
    if (next > centralEnd) {
      issues.push({ sourceName: file.name, code: 'corrupt-archive', message: 'ZIP entry metadata is truncated.' });
      break;
    }
    const path = decoder.decode(new Uint8Array(buffer, nameStart, nameLength));
    const unixMode = madeBy >> 8 === 3 ? externalAttributes >>> 16 : 0;
    const symlink = (unixMode & 0xf000) === 0xa000;
    const directory = path.endsWith('/');
    const decision = validateArchiveEntry({
      path, compressedSize, uncompressedSize, compressionMethod: method,
      encrypted: Boolean(flags & 1), symlink, directory,
    }, { entries: index, uncompressedBytes: totalUncompressed });
    if (!decision.accepted) {
      issues.push({ sourceName: file.name, path, code: decision.reason, message: 'Entry rejected by ZIP safety policy.' });
      cursor = next;
      continue;
    }
    totalUncompressed += uncompressedSize;
    budget.entries += 1;
    budget.uncompressedBytes += uncompressedSize;
    if (budget.entries > ARCHIVE_LIMITS.maxEntries || budget.uncompressedBytes > ARCHIVE_LIMITS.maxTotalUncompressedBytes) {
      issues.push({ sourceName: file.name, path, code: 'archive-limit-exceeded', message: 'Combined nested ZIP contents exceed the safe extraction limit.' });
      cursor = next;
      continue;
    }
    if (directory) { cursor = next; continue; }
    const { kind, fontFormat } = classifyAsset(path);
    if (kind === 'other') {
      issues.push({ sourceName: file.name, path, code: 'unsupported-file', message: 'Unsupported file type; skipped.' });
      cursor = next;
      continue;
    }
    if (localOffset + 30 > centralOffset || readU32(view, localOffset) !== 0x04034b50) {
      issues.push({ sourceName: file.name, path, code: 'corrupt-archive', message: 'ZIP local file header is corrupt.' });
      cursor = next;
      continue;
    }
    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const localNameStart = localOffset + 30;
    const dataStart = localNameStart + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    const centralName = new Uint8Array(buffer, nameStart, nameLength);
    const localName = localNameStart + localNameLength <= centralOffset
      ? new Uint8Array(buffer, localNameStart, localNameLength)
      : new Uint8Array();
    const namesMatch = localNameLength === nameLength && localName.length === centralName.length &&
      localName.every((byte, nameIndex) => byte === centralName[nameIndex]);
    if (!namesMatch || dataStart > centralOffset || dataEnd > centralOffset) {
      issues.push({ sourceName: file.name, path, code: 'corrupt-archive', message: 'ZIP file data is truncated.' });
      cursor = next;
      continue;
    }
    try {
      const compressed = new Uint8Array(buffer, dataStart, compressedSize);
      const bytes = method === 0 ? new Uint8Array(compressed) : await inflateRaw(compressed);
      if (bytes.byteLength !== uncompressedSize || crc32(bytes) !== expectedCrc) throw new Error('CRC or uncompressed size mismatch.');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      if (kind === 'archive') {
        const nestedName = decision.normalizedPath.split('/').pop() || 'nested.zip';
        const nested = await importZip(new File([bytes], nestedName, { type: 'application/zip' }), sourceKind, sourceId, depth + 1, budget);
        for (const nestedAsset of nested.assets) {
          if (seen.has(nestedAsset.candidate.contentSha256 || '')) {
            issues.push({ sourceName: file.name, path: decision.normalizedPath + '/' + nestedAsset.candidate.relativePath, code: 'duplicate', message: 'Duplicate content skipped.' });
          } else {
            seen.add(nestedAsset.candidate.contentSha256 || '');
            assets.push({
              ...nestedAsset,
              candidate: {
                ...nestedAsset.candidate,
                relativePath: decision.normalizedPath + '/' + nestedAsset.candidate.relativePath,
                source: { kind: sourceKind, sourceId, displayName: file.name },
              },
            });
          }
        }
        issues.push(...nested.summary.issues);
      } else if (seen.has(hash)) {
        issues.push({ sourceName: file.name, path, code: 'duplicate', message: 'Duplicate content skipped.' });
      } else {
        const resource = classifyResource(decision.normalizedPath.split('/').pop()!, decision.normalizedPath);
        if (!resource) {
          issues.push({ sourceName: file.name, path, code: 'unsupported-file', message: 'Unsupported file type; skipped.' });
        } else {
          seen.add(hash);
          assets.push({
            candidate: {
              source: { kind: sourceKind, sourceId, displayName: file.name },
              relativePath: decision.normalizedPath, fileName: decision.normalizedPath.split('/').pop()!,
              extension: decision.normalizedPath.split('.').pop()?.toLowerCase() || '',
              assetKind: resource.kind, category: resource.category, fontFormat, byteSize: bytes.byteLength,
              licence: 'unknown', contentSha256: hash,
            },
            bytes,
          });
        }
      }
    } catch (error) {
      issues.push({ sourceName: file.name, path, code: 'corrupt-archive', message: error instanceof Error ? error.message : 'Could not extract ZIP entry.' });
    }
    cursor = next;
  }
  return {
    assets,
    summary: {
      scanned: totalEntries,
      imported: assets.length,
      skipped: issues.filter(issue => issue.code !== 'duplicate').length,
      duplicates: issues.filter(issue => issue.code === 'duplicate').length,
      issues,
    },
  };
}
