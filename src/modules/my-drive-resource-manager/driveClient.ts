import type { DriveFolderPage, ImportCandidate, ImportIssue, ImportSummary } from './types';

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

export async function listDriveFolderRecursively(
  root: { id: string; name: string },
  onProgress?: (scanned: number) => void,
): Promise<{ candidates: ImportCandidate[]; issues: ImportIssue[] }> {
  const candidates: ImportCandidate[] = [];
  const issues: ImportIssue[] = [];
  const queue = [{ ...root, path: root.name }];
  const visited = new Set<string>();
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
        if (file.mimeType === DRIVE_FOLDER) {
          queue.push({ id: file.id, name: file.name, path: folder.path + '/' + file.name });
        } else {
          const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
          const fontFormat = ['ttf', 'otf', 'woff', 'woff2'].includes(extension) ? extension as ImportCandidate['fontFormat'] : undefined;
          const kind = fontFormat ? 'font' : /\.(mp3|wav|aac|m4a|ogg|flac)$/i.test(file.name) ? 'audio'
            : /\.(mp4|mov|webm|m4v)$/i.test(file.name) ? 'video'
            : /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name) ? 'image'
            : /\.(aep|mogrt|prproj|psd|ai)$/i.test(file.name) ? 'template'
            : /\.(cube|lut|exr|tiff)$/i.test(file.name) ? 'texture' : 'other';
          if (kind === 'other') {
            issues.push({ sourceName: root.name, path: folder.path + '/' + file.name, code: 'unsupported-file', message: 'Unsupported asset type; skipped.' });
          } else {
            candidates.push({
              source: { kind: 'google-drive-folder', sourceId: root.id, displayName: root.name, parentPath: folder.path },
              relativePath: folder.path + '/' + file.name,
              fileName: file.name, extension, assetKind: kind, fontFormat,
              mimeType: file.mimeType, byteSize: file.size ? Number(file.size) : undefined,
              modifiedTime: file.modifiedTime, licence: 'unknown',
            });
          }
        }
        onProgress?.(candidates.length + issues.length);
        if (candidates.length + issues.length > MAX_DRIVE_ITEMS) {
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

export async function disconnectDrive(): Promise<void> {
  const response = await fetch('/api/my-drive/oauth/logout', { method: 'POST', credentials: 'same-origin' });
  if (!response.ok) throw new Error('Could not disconnect Google Drive.');
}
