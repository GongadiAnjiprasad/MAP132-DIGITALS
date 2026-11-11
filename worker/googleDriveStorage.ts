export interface DriveStorageMetadata { id: string; name: string; mimeType: string; size?: string; parents?: string[]; }
const APP_FOLDER_KEY = 'my-drive/storage-folder-id';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

function auth(token: string) { return { Authorization: 'Bearer ' + token }; }

export async function ensureMap132DriveFolder(token: string, kv: KVNamespace): Promise<string> {
  const cached = await kv.get(APP_FOLDER_KEY);
  if (cached) {
    const check = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(cached) + '?fields=id,trashed', { headers: auth(token) });
    if (check.ok) {
      const item = await check.json() as { id?: string; trashed?: boolean };
      if (item.id && !item.trashed) return item.id;
    }
    await kv.delete(APP_FOLDER_KEY);
  }
  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'MAP132 DIGITALS Resources', mimeType: FOLDER_MIME }),
  });
  if (!response.ok) throw new Error('Google Drive could not create the MAP132 DIGITALS Resources folder.');
  const folder = await response.json() as { id?: string };
  if (!folder.id) throw new Error('Google Drive did not return the resource folder ID.');
  await kv.put(APP_FOLDER_KEY, folder.id);
  return folder.id;
}

export async function uploadMap132DriveFile(token: string, kv: KVNamespace, name: string, contentType: string, bytes: ArrayBuffer): Promise<DriveStorageMetadata> {
  const parentId = await ensureMap132DriveFolder(token, kv);
  const metadata = { name, mimeType: contentType || 'application/octet-stream', parents: [parentId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([bytes], { type: contentType || 'application/octet-stream' }), name);
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,parents', {
    method: 'POST', headers: auth(token), body: form,
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
