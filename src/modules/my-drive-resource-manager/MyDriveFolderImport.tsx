import { useState } from 'react';

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

export default function MyDriveFolderImport({ disabled = false, onImported }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
          const folderId = data.docs?.[0]?.id;
          if (!folderId) { setMessage('No folder was selected.'); setBusy(false); return; }
          try {
            setMessage('Scanning selected folder and nested subfolders for fonts…');
            const response = await fetch('/api/my-drive/import-folder', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folderId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Folder import failed.');
            await onImported();
            setMessage('Folder scan complete: ' + result.importedCount + ' font(s) imported, ' + result.skippedCount + ' skipped. ' + result.scannedCount + ' files scanned.');
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
      {busy ? 'Preparing folder import…' : 'Import fonts from Google Drive folder'}
    </button>
    {message && <p className="workspace-form-note" role="status">{message}</p>}
  </div>;
}
