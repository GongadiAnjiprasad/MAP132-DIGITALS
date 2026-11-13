import { useEffect, useRef, useState } from 'react';
import { listDriveFolderRecursively } from '../my-drive-resource-manager/driveClient';
import { buildDrivePortfolioItems, type DrivePortfolioItem, type ExistingDrivePortfolioItem } from './drivePortfolio';

type Props = {
  existingItems: ExistingDrivePortfolioItem[];
  onPublish: (items: DrivePortfolioItem[], folderId: string) => Promise<void>;
};

declare global {
  interface Window {
    gapi?: { load: (name: string, options: { callback: () => void; onerror?: () => void }) => void };
    google?: any;
  }
}

type SavedFolder = { id: string; name: string };
let pickerScriptPromise: Promise<void> | null = null;

function loadPicker(): Promise<void> {
  if (window.google?.picker && window.gapi) return Promise.resolve();
  if (!pickerScriptPromise) pickerScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-map132-drive-portfolio-picker]');
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
    script.dataset.map132DrivePortfolioPicker = 'true';
    script.onload = ready;
    script.onerror = () => reject(new Error('Google API library could not load.'));
    document.head.appendChild(script);
  });
  return pickerScriptPromise;
}

const STORAGE_KEY = 'map132-drive-selected-work-folder-v1';

export default function DrivePortfolioSync({ existingItems, onPublish }: Props) {
  const [folder, setFolder] = useState<SavedFolder | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as SavedFolder | null; } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSynced, setLastSynced] = useState('');
  const existingRef = useRef<ExistingDrivePortfolioItem[]>(existingItems);
  const publishRef = useRef(onPublish);
  const syncRef = useRef<(selected: SavedFolder) => Promise<void>>(async () => {});
  const inFlightRef = useRef(false);

  useEffect(() => { existingRef.current = existingItems; }, [existingItems]);
  useEffect(() => { publishRef.current = onPublish; }, [onPublish]);

  syncRef.current = async selected => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setMessage('Scanning the selected Drive folder and nested folders…');
    try {
      const scan = await listDriveFolderRecursively(selected, count => setMessage('Scanning Drive… ' + count + ' file(s) checked.'));
      const blockingIssues = scan.issues.filter(issue => issue.code === 'drive-permission-denied' || issue.code === 'archive-limit-exceeded');
      if (blockingIssues.length) throw new Error('Drive scan was incomplete. Existing published videos were kept. ' + blockingIssues[0].message);
      const videos = scan.candidates.filter(candidate => candidate.assetKind === 'video');
      const mapped = buildDrivePortfolioItems(videos, selected.id, existingRef.current);
      await publishRef.current(mapped, selected.id);
      existingRef.current = [...mapped, ...existingRef.current.filter(item => item.driveFolderId !== selected.id)];
      const skipped = scan.issues.filter(issue => issue.code === 'unsupported-file').length;
      setLastSynced(new Date().toLocaleString());
      setMessage('Sync complete: ' + mapped.length + ' video(s) published from this folder. ' + skipped + ' unsupported file(s) skipped.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google Drive sync failed.');
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!folder) return;
    void syncRef.current(folder);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncRef.current(folder);
    }, 5 * 60 * 1000);
    const refresh = () => { if (document.visibilityState === 'visible') void syncRef.current(folder); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [folder?.id]);

  async function chooseFolder() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/my-drive/picker-config', { credentials: 'same-origin' });
      const config = await response.json();
      if (!response.ok) throw new Error(config.error || 'Could not prepare Google Drive Picker.');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured. Complete the existing Drive connection setup first.');
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true).setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');
      const picker = new window.google.picker.PickerBuilder()
        .addView(view).setOAuthToken(config.accessToken).setDeveloperKey(config.developerKey)
        .setAppId(config.appId).setTitle('Choose your MAP132 Selected Work folder')
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.CANCEL) setBusy(false);
          if (data.action !== window.google.picker.Action.PICKED) return;
          const selected = data.docs?.[0];
          if (!selected?.id) { setMessage('No folder was selected.'); setBusy(false); return; }
          const next = { id: String(selected.id), name: String(selected.name || 'Selected Work') };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          if (folder?.id === next.id) void syncRef.current(next);
          else setFolder(next);
        }).build();
      picker.setVisible(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google Drive Picker could not open.');
      setBusy(false);
    }
  }

  return <section className="admin-card drive-portfolio-sync" aria-labelledby="drive-portfolio-sync-title">
    <div className="card-heading"><div><p className="kicker">M02 / SELECTED WORK · GOOGLE DRIVE</p><h2 id="drive-portfolio-sync-title">Automatic Drive video sync</h2></div></div>
    <p className="admin-hint">Choose one dedicated portfolio folder. Videos in its nested folders are added to Selected Work using their folder names to detect categories. The folder is checked when this dashboard opens, when it regains focus, and every five minutes while open.</p>
    <p className="admin-hint"><b>Publishing notice:</b> Every supported video found in this selected folder becomes publicly playable on MAP132 DIGITALS. Keep private/client-confidential videos outside this folder. Source Drive files are not changed.</p>
    <div className="form-row">
      <div><b>{folder ? folder.name : 'No portfolio folder selected'}</b>{lastSynced && <p className="admin-hint">Last sync: {lastSynced}</p>}</div>
      <button type="button" className="gold-button" disabled={busy} onClick={() => void chooseFolder()}>{busy ? 'Syncing…' : folder ? 'Change Drive folder' : 'Choose Drive folder'}</button>
      {folder && <button type="button" className="gold-button" disabled={busy} onClick={() => void syncRef.current(folder)}>Sync now</button>}
    </div>
    {message && <p className="admin-hint" role="status">{message}</p>}
  </section>;
}
