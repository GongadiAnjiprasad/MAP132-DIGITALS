import { useState } from 'react';
import { downloadDriveFile, listDriveFolderRecursively } from './driveClient';

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
  ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
};

export default function MyDriveFolderImport({ disabled = false, onImported }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function importSelectedFolder(folderId: string, folderName: string) {
    setMessage('Scanning selected folder and nested subfolders…');
    const scan = await listDriveFolderRecursively({ id: folderId, name: folderName }, scanned => {
      setMessage('Scanning Drive folder… ' + scanned + ' item(s) checked.');
    });
    const fonts = scan.candidates.filter(candidate => candidate.assetKind === 'font' && candidate.driveFileId);
    let imported = 0;
    const skipped = scan.issues.length + scan.candidates.length - fonts.length;
    for (let index = 0; index < fonts.length; index++) {
      const font = fonts[index];
      try {
        setMessage('Importing font ' + (index + 1) + ' of ' + fonts.length + ': ' + font.fileName);
        const bytes = await downloadDriveFile(font.driveFileId!);
        const response = await fetch('/api/my-drive/assets', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': contentTypes[font.extension] || font.mimeType || 'application/octet-stream',
            'X-Asset-Name': encodeURIComponent(font.fileName),
          },
          body: bytes,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Could not save ' + font.fileName + '.');
        imported++;
      } catch (error) {
        console.error('MAP132 Drive font import item failed:', font.fileName, error);
      }
    }
    await onImported();
    const skippedCount = skipped + (fonts.length - imported);
    const issueText = scan.issues.length ? ' ' + scan.issues.length + ' scan issue(s) were reported.' : '';
    setMessage('Folder import complete: ' + imported + ' font(s) imported, ' + skippedCount + ' skipped. ' + scan.candidates.length + ' supported items found.' + issueText);
  }
  async function chooseFolder() {
    setBusy(true);
    setMessage('');
    try {
      const configResponse = await fetch('/api/my-drive/picker-config', { credentials: 'same-origin' });
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error || 'Could not prepare Google Drive Picker.');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured in Cloudflare. Add GOOGLE_PICKER_API_KEY, then retry.');
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(config.accessToken)
        .setDeveloperKey(config.developerKey)
        .setAppId(config.appId)
        .setTitle('Choose a font folder to import')
        .setCallback(async (data: any) => {
          if (data.action !== window.google.picker.Action.PICKED) {
            if (data.action === window.google.picker.Action.CANCEL) setBusy(false);
            return;
          }
          const folder = data.docs?.[0];
          if (!folder?.id) { setMessage('No folder was selected.'); setBusy(false); return; }
          try {
            await importSelectedFolder(folder.id, String(folder.name || 'Google Drive folder'));
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Folder import failed.');
          } finally {
            setBusy(false);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google Picker could not open.');
      setBusy(false);
    }
  }
  return <div style={{ display: 'grid', gap: 8, margin: '10px 0' }}>
    <button type="button" className="gold-button" onClick={() => void chooseFolder()} disabled={disabled || busy}>
      {busy ? 'Importing Drive folder…' : 'Import fonts from Google Drive folder'}
    </button>
    {message && <p className="workspace-form-note" role="status">{message}</p>}
  </div>;
}
