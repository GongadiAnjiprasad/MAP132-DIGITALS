export interface DriveStorageMetadata { id: string; name: string; mimeType: string; size?: string; parents?: string[]; }
const APP_FOLDER_KEY = 'my-drive/storage-folder-id';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const CATEGORIES = new Set(['Sound Effects','Wedding','Birthday','Trailer BGMs','Plugins','Fonts','Images','Videos','Other']);

function auth(token: string) { return { Authorization: 'Bearer ' + token }; }

export async function ensureMap132DriveFolder(token: string, kv: KVNamespace): Promise<string> {
  const cached = await kv.get(APP_FOLDER_KEY);
  if (cached) {
    const check = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(cached) + '?fields=id,name,trashed', { headers: auth(token) });
    if (check.ok) {
      const item = await check.json() as { id?: string; name?: string; trashed?: boolean };
      if (item.id && !item.trashed) {
        if (item.name !== 'MAP132 Workspace') {
          await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(item.id), {
            method: 'PATCH', headers: { ...auth(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'MAP132 Workspace' }),
          });
        }
        return item.id;
      }
    }
    await kv.delete(APP_FOLDER_KEY);
  }
  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'MAP132 Workspace', mimeType: FOLDER_MIME }),
  });
  if (!response.ok) throw new Error('Google Drive could not create the MAP132 Workspace folder.');
  const folder = await response.json() as { id?: string };
  if (!folder.id) throw new Error('Google Drive did not return the workspace folder ID.');
  await kv.put(APP_FOLDER_KEY, folder.id);
  return folder.id;
}

export async function ensureMap132CategoryFolder(token: string, kv: KVNamespace, category: string): Promise<string> {
  const safeCategory = CATEGORIES.has(category) ? category : 'Other';
  const key = 'my-drive/category-folder-id/' + encodeURIComponent(safeCategory);
  const cached = await kv.get(key);
  if (cached) {
    const check = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(cached) + '?fields=id,trashed', { headers: auth(token) });
    if (check.ok) {
      const item = await check.json() as { id?: string; trashed?: boolean };
      if (item.id && !item.trashed) return item.id;
    }
    await kv.delete(key);
  }
  const parentId = await ensureMap132DriveFolder(token, kv);
  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,parents', {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: safeCategory, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!response.ok) throw new Error('Google Drive could not create the ' + safeCategory + ' category folder.');
  const folder = await response.json() as { id?: string };
  if (!folder.id) throw new Error('Google Drive did not return the category folder ID.');
  await kv.put(key, folder.id);
  return folder.id;
}

/**
 * Uses Google's resumable upload protocol so large resources do not have to be
 * sent as a multipart body. The caller enforces the application's size limit.
 */
export async function uploadMap132DriveFile(token: string, kv: KVNamespace, name: string, contentType: string, bytes: ArrayBuffer, category = 'Other'): Promise<DriveStorageMetadata> {
  const parentId = await ensureMap132CategoryFolder(token, kv, category);
  const mimeType = contentType || 'application/octet-stream';
  const metadata = { name, mimeType, parents: [parentId] };
  const session = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,parents', {
    method: 'POST',
    headers: {
      ...auth(token),
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(bytes.byteLength),
    },
    body: JSON.stringify(metadata),
  });
  if (!session.ok) throw new Error('Google Drive could not start the resource upload session.');
  const uploadUrl = session.headers.get('Location');
  if (!uploadUrl) throw new Error('Google Drive did not return a resumable upload URL.');
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(bytes.byteLength) },
    body: bytes,
  });
  if (!response.ok) throw new Error('Google Drive upload failed. Check Drive quota and granted permissions.');
  const result = await response.json() as DriveStorageMetadata;
  if (!result.id) throw new Error('Google Drive upload did not return a file ID.');
  return result;
}

export async function downloadMap132DriveFile(token: string, fileId: string): Promise<Response> {
  return fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) + '?alt=media', { headers: auth(token) });
}

export async function deleteMap132DriveFile(token: string, fileId: string): Promise<boolean> {
  const response = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId), { method: 'DELETE', headers: auth(token) });
  return response.status === 204 || response.status === 200 || response.status === 404;
}
