import type { DriveFolderPage, ImportCandidate, ImportIssue, ResourceCategory } from './types';

const DRIVE_FOLDER = 'application/vnd.google-apps.folder';
const PAGE_SIZE = 100;
const MAX_DRIVE_ITEMS = 5_000;

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(response.status === 401 ? 'Google Drive session expired. Reconnect to continue.' : 'Google Drive request failed.');
  return response.json() as Promise<T>;
}

export async function getDriveSession(): Promise<{ connected: boolean; expiresAt: number | null }> {
  return requestJson('/api/my-drive/session');
}

export async function listDrivePage(parentId?: string, pageToken?: string): Promise<DriveFolderPage> {
  const url = new URL('/api/my-drive/files', window.location.origin);
  if (parentId) url.searchParams.set('parentId', parentId);
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  return requestJson<DriveFolderPage>(url.toString());
}

const supported = new Set([
  'ttf','otf','woff','woff2','mp3','wav','aac','m4a','ogg','flac',
  'mp4','mov','webm','m4v','jpg','jpeg','png','webp','gif','avif','svg',
  'zip','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm',
]);

export function classifyResource(fileName: string, relativePath = ''): { category: ResourceCategory; kind: ImportCandidate['assetKind'] } | null {
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  if (!supported.has(ext)) return null;
  const text = (relativePath + ' ' + fileName).toLowerCase().replace(/[_-]+/g, ' ');
  const has = (words: string[]) => words.some(word => text.includes(word));
  const font = ['ttf','otf','woff','woff2'].includes(ext);
  const audio = ['mp3','wav','aac','m4a','ogg','flac'].includes(ext);
  const video = ['mp4','mov','webm','m4v'].includes(ext);
  const image = ['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext);
  const plugin = ['aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'].includes(ext);
  if (has(['sound effect','sound effects','sfx','whoosh','riser','impact','boom','transition','heartbeat','foley'])) return { category: 'Sound Effects', kind: 'audio' };
  if (has(['wedding','marriage','pelli'])) return { category: 'Wedding', kind: font ? 'font' : audio ? 'audio' : video ? 'video' : image ? 'image' : 'template' };
  if (has(['birthday','bday','birth day'])) return { category: 'Birthday', kind: font ? 'font' : audio ? 'audio' : video ? 'video' : image ? 'image' : 'template' };
  if (has(['trailer bgm','trailer music','trailer','background music','bgm','cinematic score'])) return { category: 'Trailer BGMs', kind: audio ? 'audio' : font ? 'font' : video ? 'video' : image ? 'image' : 'archive' };
  if (has(['plugin','plugins','preset pack','presets'])) return { category: 'Plugins', kind: plugin ? 'template' : 'archive' };
  if (font) return { category: 'Fonts', kind: 'font' };
  if (audio) return { category: 'Sound Effects', kind: 'audio' };
  if (video) return { category: 'Videos', kind: 'video' };
  if (image) return { category: 'Images', kind: 'image' };
  if (plugin || ext === 'zip') return { category: 'Plugins', kind: 'archive' };
  return null;
}

export async function listDriveFolderRecursively(
  root: { id: string; name: string },
  onProgress?: (scanned: number) => void,
): Promise<{ candidates: ImportCandidate[]; issues: ImportIssue[] }> {
  const candidates: ImportCandidate[] = [];
  const issues: ImportIssue[] = [];
  const queue = [{ ...root, path: root.name }];
  const visited = new Set<string>();
  let scanned = 0;
  while (queue.length) {
    const folder = queue.shift()!;
    if (visited.has(folder.id)) continue;
    visited.add(folder.id);
    if (visited.size > MAX_DRIVE_ITEMS) {
      issues.push({ sourceName: root.name, path: folder.path, code: 'archive-limit-exceeded', message: 'Drive folder scan stopped at the 5,000-folder safety limit.' });
      break;
    }
    let pageToken: string | undefined;
    do {
      let page: DriveFolderPage;
      try { page = await listDrivePage(folder.id, pageToken); }
      catch (error) {
        issues.push({ sourceName: root.name, path: folder.path, code: 'drive-permission-denied', message: error instanceof Error ? error.message : 'Could not read this Drive folder.' });
        break;
      }
      for (const file of page.files || []) {
        scanned++;
        const relativePath = folder.path + '/' + file.name;
        if (file.mimeType === DRIVE_FOLDER) {
          queue.push({ id: file.id, name: file.name, path: relativePath });
        } else {
          const classified = classifyResource(file.name, relativePath);
          if (!classified) {
            issues.push({ sourceName: root.name, path: relativePath, code: 'unsupported-file', message: 'Unsupported file type; skipped.' });
          } else {
            const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
            const fontFormat = ['ttf','otf','woff','woff2'].includes(extension) ? extension as ImportCandidate['fontFormat'] : undefined;
            candidates.push({
              source: { kind: 'google-drive-folder', sourceId: root.id, displayName: root.name, parentPath: folder.path },
              relativePath, fileName: file.name, driveFileId: file.id, extension,
              assetKind: classified.kind, category: classified.category, fontFormat,
              mimeType: file.mimeType, byteSize: file.size ? Number(file.size) : undefined,
              modifiedTime: file.modifiedTime, licence: 'unknown',
            });
          }
        }
        onProgress?.(scanned);
        if (scanned >= MAX_DRIVE_ITEMS) {
          issues.push({ sourceName: root.name, path: folder.path, code: 'archive-limit-exceeded', message: 'Drive scan stopped at the 5,000-file safety limit.' });
          queue.length = 0;
          break;
        }
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
  }
  return { candidates, issues };
}

export async function downloadDriveFile(fileId: string): Promise<ArrayBuffer> {
  if (!/^[a-zA-Z0-9_-]{1,256}$/.test(fileId)) throw new Error('Invalid Google Drive file ID.');
  const response = await fetch('/api/my-drive/download/' + encodeURIComponent(fileId), { credentials: 'same-origin' });
  if (!response.ok) throw new Error(response.status === 401 ? 'Google Drive session expired. Reconnect to continue.' : 'Could not download the selected Drive file.');
  return response.arrayBuffer();
}
