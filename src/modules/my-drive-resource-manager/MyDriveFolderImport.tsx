import { useState } from 'react';
import { downloadDriveFile, listDriveFolderRecursively } from './driveClient';
import { importZip } from './zipImporter';

type Props = { disabled?: boolean; onImported: () => Promise<void> | void };

declare global {
  interface Window {
    gapi?: { load: (name: string, options: { callback: () => void; onerror?: () => void }) => void };
    google?: any;
  }
}

let pickerScriptPromise: Promise<void> | null = null;
function loadPicker(): Promise<void> {
  if (window.google?.picker && window.gapi) return Promise.resolve();
  if (!pickerScriptPromise) {
    pickerScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-map132-google-api]');
      const script = existing || document.createElement('script');
      const ready = () => {
        if (!window.gapi) { reject(new Error('Google API library did not load.')); return; }
        window.gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('Google Picker could not load.')) });
      };
      if (existing) {
        if (window.gapi) ready();
        else existing.addEventListener('load', ready, { once: true });
        return;
      }
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.dataset.map132GoogleApi = 'true';
      script.onload = ready;
      script.onerror = () => reject(new Error('Google API library could not load.'));
      document.head.appendChild(script);
    });
  }
  return pickerScriptPromise;
}

const contentTypes: Record<string, string> = {
  ttf:'font/ttf', otf:'font/otf', woff:'font/woff', woff2:'font/woff2',
  mp3:'audio/mpeg', wav:'audio/wav', aac:'audio/aac', m4a:'audio/mp4', ogg:'audio/ogg', flac:'audio/flac',
  mp4:'video/mp4', mov:'video/quicktime', webm:'video/webm', m4v:'video/x-m4v',
  jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif', avif:'image/avif', svg:'image/svg+xml',
  zip:'application/zip', aep:'application/octet-stream', mogrt:'application/octet-stream',
  prproj:'application/octet-stream', prfpset:'application/octet-stream', ffx:'application/octet-stream',
  cube:'application/octet-stream', look:'application/octet-stream', drx:'application/octet-stream',
  setting:'application/octet-stream', preset:'application/octet-stream', prm:'application/octet-stream',
};

export default function MyDriveFolderImport({ disabled = false, onImported }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function importSelectedFolder(folderId: string, folderName: string) {
    setMessage('Scanning only the selected folder and its nested folders…');
    const scan = await listDriveFolderRecursively({ id: folderId, name: folderName }, scanned => {
      setMessage('Scanning selected folder… ' + scanned + ' item(s) checked.');
    });
    let imported = 0, skipped = scan.issues.length, failed = 0;
    const candidates = scan.candidates.filter(item => item.driveFileId);
    for (let index = 0; index < candidates.length; index++) {
      const item = candidates[index];
      if (item.byteSize && item.byteSize > 100 * 1024 * 1024) { skipped++; continue; }
      try {
        setMessage((item.extension === 'zip' ? 'Extracting ZIP ' : 'Saving ') + (index + 1) + ' of ' + candidates.length + ' · ' + item.category + ' · ' + item.fileName);
        const bytes = await downloadDriveFile(item.driveFileId!);
        if (!bytes.byteLength || bytes.byteLength > 100 * 1024 * 1024) { skipped++; continue; }
        if (item.extension === 'zip') {
          const archive = new File([bytes], item.fileName, { type: 'application/zip' });
          const extracted = await importZip(archive, 'google-drive-zip', item.driveFileId!);
          skipped += extracted.summary.skipped + extracted.summary.duplicates;
          for (const asset of extracted.assets) {
            const extractedFile = new File([asset.bytes], asset.candidate.fileName, { type: contentTypes[asset.candidate.extension] || 'application/octet-stream' });
            const upload = await fetch('/api/my-drive/assets', {
              method: 'POST', credentials: 'same-origin',
              headers: {
                'Content-Type': contentTypes[asset.candidate.extension] || 'application/octet-stream',
                'X-Asset-Name': encodeURIComponent(asset.candidate.fileName),
                'X-Asset-Category': asset.candidate.category,
                'X-Asset-Source-Path': encodeURIComponent(item.relativePath + '/' + asset.candidate.relativePath),
              },
              body: extractedFile,
            });
            const result = await upload.json().catch(() => ({}));
            if (!upload.ok) throw new Error(result.error || 'Could not save extracted ' + asset.candidate.fileName + '.');
            if (result.duplicate) skipped++; else imported++;
          }
        } else {
          const response = await fetch('/api/my-drive/assets', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': contentTypes[item.extension] || item.mimeType || 'application/octet-stream',
              'X-Asset-Name': encodeURIComponent(item.fileName),
              'X-Asset-Category': item.category,
              'X-Asset-Source-Path': encodeURIComponent(item.relativePath),
            },
            body: bytes,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || 'Could not save ' + item.fileName + '.');
          if (result.duplicate) skipped++; else imported++;
        }
      } catch (error) {
        failed++;
        console.error('MAP132 Drive import item failed:', item.fileName, error);
      }
    }
    await onImported();
    const categoryCount = new Map<string, number>();
    for (const item of candidates) categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
    const categories = [...categoryCount.entries()].map(([name, count]) => name + ': ' + count).join(' · ');
    setMessage('Folder sync complete: ' + imported + ' saved, ' + skipped + ' skipped/duplicate, ' + failed + ' failed. ' + categories);
    if (scan.issues.length) setMessage(current => current + ' ' + scan.issues.length + ' scan issue(s); unsupported files were skipped.');
  }

  async function chooseFolder() {
    setBusy(true);
    setMessage('');
    try {
      const configResponse = await fetch('/api/my-drive/picker-config', { credentials: 'same-origin' });
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error || 'Could not prepare Google Drive Picker.');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured. Complete the Google Drive connection setup first.');
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true).setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');
      const picker = new window.google.picker.PickerBuilder()
        .addView(view).setOAuthToken(config.accessToken).setDeveloperKey(config.developerKey)
        .setAppId(config.appId).setTitle('Choose one folder for MAP132 Workspace')
        .setCallback(async (data: any) => {
          if (data.action !== window.google.picker.Action.PICKED) {
            if (data.action === window.google.picker.Action.CANCEL) setBusy(false);
            return;
          }
          const folder = data.docs?.[0];
          if (!folder?.id) { setMessage('No folder was selected.'); setBusy(false); return; }
          try { await importSelectedFolder(folder.id, String(folder.name || 'Selected Drive folder')); }
          catch (error) { setMessage(error instanceof Error ? error.message : 'Folder sync failed.'); }
          finally { setBusy(false); }
        }).build();
      picker.setVisible(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google Picker could not open.');
      setBusy(false);
    }
  }

  return <div style={{ display: 'grid', gap: 8, margin: '10px 0' }}>
    <button type="button" className="gold-button" onClick={() => void chooseFolder()} disabled={disabled || busy}>
      {busy ? 'Syncing selected folder…' : 'Choose a Drive folder'}
    </button>
    <p className="workspace-form-note">Only the folder you select is scanned. Supported files are automatically grouped and copied into category folders in MAP132 Workspace.</p>
    {message && <p className="workspace-form-note" role="status">{message}</p>}
  </div>;
}
