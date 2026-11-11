const FONT_EXTENSIONS = new Set(['ttf', 'otf', 'woff', 'woff2']);
const MAX_ARCHIVE_BYTES = 300 * 1024 * 1024;
const MAX_FONT_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
const MAX_ENTRIES = 1000;

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function extensionOf(name: string): string {
  return name.split('/').pop()?.split('.').pop()?.toLowerCase() || '';
}

export async function extractSupportedFontsFromZip(file: File): Promise<File[]> {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('ZIP archive exceeds the 300 MB import limit.');
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const minEocd = Math.max(0, bytes.length - 22 - 65535);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= minEocd; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP directory is missing or invalid.');
  const entries = view.getUint16(eocd + 10, true);
  const directorySize = view.getUint32(eocd + 12, true);
  let offset = view.getUint32(eocd + 16, true);
  if (entries === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported yet. Use a standard ZIP archive.');
  }
  if (entries > MAX_ENTRIES || offset + directorySize > eocd) {
    throw new Error('ZIP archive exceeds the supported entry count or has an invalid directory.');
  }
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const fonts: File[] = [];
  let totalUncompressed = 0;
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('ZIP central directory contains an invalid entry.');
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const expectedCrc = view.getUint32(offset + 16, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const externalAttributes = view.getUint32(offset + 38, true);
    const localOffset = view.getUint32(offset + 42, true);
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (entryEnd > bytes.length) throw new Error('ZIP entry metadata is truncated.');
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const rawName = decoder.decode(nameBytes).replace(/\\/g, '/');
    offset = entryEnd;
    const parts = rawName.split('/');
    if (rawName.startsWith('/') || parts.some(part => part === '..')) continue;
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0xf000) === 0xa000 || rawName.endsWith('/')) continue;
    if (!FONT_EXTENSIONS.has(extensionOf(rawName))) continue;
    if ((flags & 1) !== 0) continue;
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error('ZIP64 font entries are not supported yet.');
    if (uncompressedSize > MAX_FONT_BYTES || totalUncompressed + uncompressedSize > MAX_TOTAL_BYTES) {
      throw new Error('ZIP font contents exceed the per-file or total extraction limit.');
    }
    if (method !== 0 && method !== 8) continue;
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error('ZIP local file header is invalid.');
    }
    const localFlags = view.getUint16(localOffset + 6, true);
    const localMethod = view.getUint16(localOffset + 8, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const localName = decoder.decode(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength)).replace(/\\/g, '/');
    if (localName !== rawName || localMethod !== method || localFlags !== flags) throw new Error('ZIP local and central directory records do not match.');
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataStart < 0 || dataEnd > bytes.length) throw new Error('ZIP font data is truncated.');
    const compressed = bytes.slice(dataStart, dataEnd);
    let output: ArrayBuffer;
    if (method === 0) {
      output = compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength);
    } else {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support ZIP deflate extraction. Try a current Chrome version.');
      try {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
        output = await new Response(stream).arrayBuffer();
      } catch {
        throw new Error('A font inside this ZIP could not be decompressed.');
      }
    }
    if (output.byteLength !== uncompressedSize) throw new Error('Extracted ZIP font size does not match its directory record.');
    if (crc32(new Uint8Array(output)) !== expectedCrc) throw new Error('Extracted ZIP font failed its CRC integrity check.');
    totalUncompressed += output.byteLength;
    const name = parts[parts.length - 1];
    const ext = extensionOf(name);
    const mime = ext === 'woff' ? 'font/woff' : ext === 'woff2' ? 'font/woff2' : ext === 'otf' ? 'font/otf' : 'font/ttf';
    fonts.push(new File([output], name, { type: mime }));
  }
  return fonts;
}
