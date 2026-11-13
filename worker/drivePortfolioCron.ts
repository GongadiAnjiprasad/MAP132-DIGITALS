import type { ImportCandidate } from '../src/modules/my-drive-resource-manager/types';
import { buildDrivePortfolioItems, type ExistingDrivePortfolioItem } from '../src/modules/drive-portfolio/drivePortfolio';

type KV = { get(key: string): Promise<string | null>; put(key: string, value: string): Promise<void> };
type Env = { MAP132_KV?: KV };
type Folder = { id: string; name: string; path: string };
type DriveFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string; trashed?: boolean };
type DrivePage = { files?: DriveFile[]; nextPageToken?: string };
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v']);
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const MAX_ITEMS = 5000;
const PAGE_SIZE = 100;

/**
 * Scheduled, read-only Drive folder poll. Portfolio KV is updated only after
 * every page/folder has been scanned successfully; partial scans never unpublish
 * existing records. Drive source files are never modified.
 */
export async function syncDrivePortfolioFromFolder(
  env: Env,
  getAccessToken: () => Promise<string | null>,
): Promise<{ published: number; removed: number; scanned: number }> {
  if (!env.MAP132_KV) throw new Error('MAP132_KV is not configured.');
  const savedFolder = await env.MAP132_KV.get('my-drive/portfolio-folder');
  if (!savedFolder) return { published: 0, removed: 0, scanned: 0 };
  let root: { id?: string; name?: string };
  try { root = JSON.parse(savedFolder); } catch { throw new Error('Saved Drive portfolio folder metadata is invalid.'); }
  if (!root.id || !root.name || !/^[a-zA-Z0-9_-]{1,256}$/.test(root.id)) throw new Error('Saved Drive portfolio folder is invalid.');

  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Drive OAuth refresh is unavailable; existing portfolio items were kept.');
  const queue: Folder[] = [{ id: root.id, name: root.name, path: root.name }];
  const visited = new Set<string>();
  const candidates: ImportCandidate[] = [];
  let scanned = 0;

  while (queue.length) {
    const folder = queue.shift()!;
    if (visited.has(folder.id)) continue;
    visited.add(folder.id);
    if (visited.size > MAX_ITEMS) throw new Error('Drive portfolio scan exceeded the folder safety limit; existing items were kept.');
    let pageToken: string | undefined;
    do {
      const listUrl = new URL('https://www.googleapis.com/drive/v3/files');
      listUrl.searchParams.set('q', "'" + folder.id + "' in parents and trashed = false");
      listUrl.searchParams.set('pageSize', String(PAGE_SIZE));
      listUrl.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,modifiedTime,trashed)');
      listUrl.searchParams.set('orderBy', 'folder,name');
      if (pageToken) listUrl.searchParams.set('pageToken', pageToken);
      const response = await fetch(listUrl, { headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' } });
      if (!response.ok) throw new Error('Google Drive folder scan failed (' + response.status + '); existing portfolio items were kept.');
      const page = await response.json() as DrivePage;
      for (const file of page.files || []) {
        if (!file.id || !file.name || file.trashed) continue;
        scanned++;
        if (scanned > MAX_ITEMS) throw new Error('Drive portfolio scan exceeded the 5,000-file safety limit; existing items were kept.');
        const relativePath = folder.path + '/' + file.name;
        if (file.mimeType === FOLDER_MIME) {
          queue.push({ id: file.id, name: file.name, path: relativePath });
          continue;
        }
        const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
        if (!VIDEO_EXTENSIONS.has(extension) || !String(file.mimeType || '').startsWith('video/')) continue;
        candidates.push({
          source: { kind: 'google-drive-folder', sourceId: root.id, displayName: root.name, parentPath: folder.path },
          relativePath, fileName: file.name, driveFileId: file.id, extension,
          assetKind: 'video', category: 'Videos', mimeType: file.mimeType,
          byteSize: file.size ? Number(file.size) : undefined, modifiedTime: file.modifiedTime, licence: 'unknown',
        });
      }
      pageToken = page.nextPageToken || undefined;
    } while (pageToken);
  }

  const currentRaw = await env.MAP132_KV.get('portfolio/content');
  let current: Record<string, unknown>;
  try {
    const parsed = JSON.parse(currentRaw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    current = parsed as Record<string, unknown>;
  } catch { throw new Error('Portfolio content is invalid; existing published data was kept.'); }
  const currentItems = Array.isArray(current.items) ? current.items.filter(item => item && typeof item === 'object') as ExistingDrivePortfolioItem[] : [];
  const previousForFolder = currentItems.filter(item => item.driveFolderId === root.id);
  const mapped = buildDrivePortfolioItems(candidates, root.id, currentItems);
  const nextItems = [...mapped, ...currentItems.filter(item => item.driveFolderId !== root.id)];
  await env.MAP132_KV.put('portfolio/content', JSON.stringify({ ...current, items: nextItems }));
  return { published: mapped.length, removed: Math.max(0, previousForFolder.length - mapped.length), scanned };
}
