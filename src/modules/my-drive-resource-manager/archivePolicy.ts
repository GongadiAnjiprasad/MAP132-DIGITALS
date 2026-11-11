import type { CreativeAssetKind, SupportedFontFormat } from './types';

export const SUPPORTED_FONT_FORMATS = ['ttf', 'otf', 'woff', 'woff2'] as const;
export const ARCHIVE_LIMITS = Object.freeze({
  maxEntries: 2_000,
  maxFileBytes: 25 * 1024 * 1024,
  maxTotalUncompressedBytes: 250 * 1024 * 1024,
  maxCompressionRatio: 100,
});

const EXTENSION_KIND: Record<string, CreativeAssetKind> = {
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font',
  mp3: 'audio', wav: 'audio', aac: 'audio', m4a: 'audio', ogg: 'audio', flac: 'audio',
  mp4: 'video', mov: 'video', webm: 'video', m4v: 'video',
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image', avif: 'image',
  aep: 'template', mogrt: 'template', prproj: 'template', psd: 'template', ai: 'template',
  cube: 'texture', lut: 'texture', exr: 'texture', tiff: 'texture',
  zip: 'archive',
};

export function getExtension(fileName: string): string {
  const leaf = fileName.split(/[\\/]/).pop() ?? '';
  const dot = leaf.lastIndexOf('.');
  return dot > 0 ? leaf.slice(dot + 1).toLowerCase() : '';
}

export function classifyAsset(fileName: string): {
  kind: CreativeAssetKind;
  fontFormat?: SupportedFontFormat;
} {
  const extension = getExtension(fileName);
  const kind = EXTENSION_KIND[extension] ?? 'other';
  return {
    kind,
    ...(kind === 'font' ? { fontFormat: extension as SupportedFontFormat } : {}),
  };
}

/** Normalize a ZIP entry path and reject traversal or absolute paths. */
export function normalizeArchivePath(input: string): string | null {
  if (!input || input.includes('\0')) return null;
  const path = input.replace(/\\/g, '/');
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path) || path.startsWith('//')) return null;
  const segments = path.split('/');
  if (segments.some(segment => segment === '..')) return null;
  const normalized = segments.filter(segment => segment && segment !== '.').join('/');
  return normalized || null;
}

export interface ArchiveEntryMetadata {
  path: string;
  uncompressedSize: number;
  compressedSize: number;
  compressionMethod: number;
  encrypted?: boolean;
  symlink?: boolean;
  directory?: boolean;
}

export type ArchiveEntryDecision =
  | { accepted: true; normalizedPath: string }
  | { accepted: false; reason: 'unsafe-path' | 'encrypted-entry' | 'symlink-entry' | 'unsupported-compression' | 'archive-limit-exceeded' };

export function validateArchiveEntry(
  entry: ArchiveEntryMetadata,
  totals: { entries: number; uncompressedBytes: number },
): ArchiveEntryDecision {
  const normalizedPath = normalizeArchivePath(entry.path);
  if (!normalizedPath) return { accepted: false, reason: 'unsafe-path' };
  if (entry.encrypted) return { accepted: false, reason: 'encrypted-entry' };
  if (entry.symlink) return { accepted: false, reason: 'symlink-entry' };
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    return { accepted: false, reason: 'unsupported-compression' };
  }
  const ratio = entry.compressedSize > 0
    ? entry.uncompressedSize / entry.compressedSize
    : entry.uncompressedSize > 0 ? Number.POSITIVE_INFINITY : 1;
  if (
    totals.entries + 1 > ARCHIVE_LIMITS.maxEntries ||
    !Number.isFinite(entry.uncompressedSize) ||
    !Number.isFinite(entry.compressedSize) ||
    entry.uncompressedSize < 0 ||
    entry.compressedSize < 0 ||
    entry.uncompressedSize > ARCHIVE_LIMITS.maxFileBytes ||
    totals.uncompressedBytes + entry.uncompressedSize > ARCHIVE_LIMITS.maxTotalUncompressedBytes ||
    ratio > ARCHIVE_LIMITS.maxCompressionRatio
  ) {
    return { accepted: false, reason: 'archive-limit-exceeded' };
  }
  return { accepted: true, normalizedPath };
}
