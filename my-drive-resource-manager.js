(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const status = byId('myDriveStatus');
  const gate = byId('myDriveGate');
  const setupForm = byId('myDriveSetupForm');
  const unlockForm = byId('myDriveUnlockForm');
  const contentPanel = byId('myDriveContent');
  const itemsBox = byId('myDriveItems');
  const pickerButtons = [byId('myDrivePicker'), byId('myDriveBrowse')].filter(Boolean);
  let connected = false;
  let unlocked = false;
  let busy = false;
  let pickerPromise = null;
  let nextCursor = null;

  function message(text, isError) {
    if (!status) return;
    status.textContent = text || '';
    status.dataset.error = isError ? 'true' : 'false';
    if (isError && /admin dashboard|sign in/i.test(text)) {
      const link = document.createElement('a');
      link.href = 'index.html#admin';
      link.textContent = ' Open Admin Dashboard';
      link.style.color = 'var(--gold)';
      link.style.marginLeft = '6px';
      status.appendChild(link);
    }
  }

  async function api(path, options) {
    const response = await fetch(path, Object.assign({ credentials: 'same-origin', cache: 'no-store' }, options || {}));
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(data.error || ('Request failed (' + response.status + ').'));
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setBusy(value) {
    busy = value;
    const ids = ['myDriveConnect', 'myDrivePicker', 'myDriveBrowse', 'myDriveLock', 'myDriveDisconnect'];
    ids.forEach(id => { const el = byId(id); if (el) el.disabled = value || (id !== 'myDriveConnect' && !connected); });
    const zip = byId('myDriveLocalZip');
    if (zip) zip.disabled = value || !connected;
    [setupForm, unlockForm].forEach(form => {
      if (!form) return;
      form.querySelectorAll('button,input').forEach(el => { el.disabled = value; });
    });
  }

  function sizeLabel(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderAssets(assets) {
    if (!itemsBox) return;
    itemsBox.replaceChildren();
    if (!assets.length) {
      itemsBox.appendChild(element('p', 'mydrive-empty', 'No saved resources yet. Import fonts from a Drive folder or upload a ZIP archive.'));
      return;
    }
    assets.forEach(asset => {
      const card = element('article', 'mydrive-item');
      const title = element('strong', '', asset.name || 'Untitled resource');
      const meta = element('small', '', String(asset.kind || 'file').toUpperCase() + ' · ' + sizeLabel(asset.size) + ' · ' + (asset.licenseStatus || 'licence unverified') + ' · Saved ' + (asset.storedAt ? new Date(asset.storedAt).toLocaleString() : 'date unavailable'));
      card.append(title, meta);
      const previewUrl = '/api/my-drive/assets/' + encodeURIComponent(asset.id) + '/preview';
      if (asset.kind === 'audio') {
        const audio = element('audio'); audio.controls = true; audio.preload = 'none'; audio.src = previewUrl; audio.style.width = '100%'; card.appendChild(audio);
      } else if (asset.kind === 'video') {
        const video = element('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = previewUrl; video.style.width = '100%'; card.appendChild(video);
      } else if (asset.kind === 'image') {
        const img = element('img'); img.src = previewUrl; img.alt = asset.name || 'Saved image'; img.loading = 'lazy'; img.style.cssText = 'max-width:100%;max-height:220px;object-fit:contain'; card.appendChild(img);
      } else if (asset.kind === 'font') {
        card.appendChild(element('div', 'mydrive-font-sample', 'MAP132 · Aa 123 · తెలుగు'));
      }
      const actions = element('div', 'mydrive-actions');
      const download = element('a', 'mydrive-upload', 'Download');
      download.href = '/api/my-drive/assets/' + encodeURIComponent(asset.id) + '/download';
      download.setAttribute('download', asset.name || 'resource');
      const remove = element('button', '', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', () => removeAsset(asset));
      actions.append(download, remove);
      card.appendChild(actions);
      itemsBox.appendChild(card);
    });
    if (nextCursor) {
      const more = element('button', 'mydrive-load-more', 'Load more saved resources');
      more.type = 'button';
      more.addEventListener('click', loadMoreAssets);
      itemsBox.appendChild(more);
    }
  }

  async function loadAssets(append) {
    if (!connected || !unlocked) return;
    const query = '/api/my-drive/assets?limit=50' + (append && nextCursor ? '&cursor=' + encodeURIComponent(nextCursor) : '');
    const data = await api(query);
    const incoming = Array.isArray(data.assets) ? data.assets : [];
    if (append) {
      const existing = Array.from(itemsBox.querySelectorAll('.mydrive-item strong')).map(node => node.textContent);
      window.__map132MyDriveAssets = (window.__map132MyDriveAssets || []).concat(incoming.filter(item => !existing.includes(item.name)));
    } else {
      window.__map132MyDriveAssets = incoming;
    }
    nextCursor = typeof data.cursor === 'string' && data.cursor ? data.cursor : null;
    renderAssets(window.__map132MyDriveAssets);
  }

  async function refreshState() {
    try {
      const lock = await api('/api/my-drive/lock/status');
      unlocked = Boolean(lock.unlocked);
      if (gate) gate.hidden = unlocked;
      if (setupForm) setupForm.hidden = Boolean(lock.configured);
      if (unlockForm) unlockForm.hidden = !lock.configured;
      if (contentPanel) contentPanel.hidden = !unlocked;
      if (!unlocked) {
        connected = false;
        window.__map132MyDriveAssets = [];
        nextCursor = null;
        renderAssets([]);
        message(lock.configured ? 'My Drive is locked. Enter your separate My Drive password.' : 'Create your separate My Drive password. First-time setup needs an active Admin Dashboard sign-in.');
        return;
      }
      const session = await api('/api/my-drive/session');
      connected = Boolean(session.connected);
      const connect = byId('myDriveConnect');
      if (connect) connect.textContent = connected ? 'Google Drive connected' : 'Connect Google Drive';
      pickerButtons.forEach(button => { button.disabled = busy || !connected; });
      const zip = byId('myDriveLocalZip');
      if (zip) zip.disabled = busy || !connected;
      const disconnect = byId('myDriveDisconnect');
      if (disconnect) disconnect.disabled = busy || !connected;
      if (connected) {
        await loadAssets(false);
        message('Google Drive connected. Saved resources are stored in your MAP132 DIGITALS Resources folder.');
      } else {
        window.__map132MyDriveAssets = [];
        nextCursor = null;
        renderAssets([]);
        message('My Drive unlocked. Connect your Google account to import and retrieve persistent resources.');
      }
    } catch (error) {
      message(error.message || 'Could not check My Drive status. Refresh and try again.', true);
    }
  }

  async function passwordSubmit(event, path, inputId) {
    event.preventDefault();
    const input = byId(inputId);
    const password = input ? input.value : '';
    setBusy(true);
    message(path.endsWith('/setup') ? 'Creating your separate My Drive password…' : 'Unlocking My Drive…');
    try {
      await api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      if (input) input.value = '';
      await refreshState();
      message(path.endsWith('/setup') ? 'My Drive password created and unlocked.' : 'My Drive unlocked.');
    } catch (error) {
      if (error.status === 403) {
        message('Admin sign-in required before first-time setup. Open Dashboard, sign in, then return here.', true);
      } else {
        message(error.message || 'Password action failed.', true);
      }
    } finally { setBusy(false); }
  }

  async function connectDrive() {
    setBusy(true);
    message('Preparing secure Google Drive authorization…');
    try {
      const data = await api('/api/my-drive/oauth/start', { method: 'POST' });
      if (!data.authorizationUrl) throw new Error('Google did not return an authorization page.');
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      message(error.message || 'Could not start Google Drive connection.', true);
      setBusy(false);
    }
  }

  function loadPicker() {
    if (window.google && window.google.picker && window.gapi) return Promise.resolve();
    if (pickerPromise) return pickerPromise;
    pickerPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-map132-google-api]');
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
    return pickerPromise;
  }

  async function openFolderPicker() {
    if (!connected || busy) return;
    setBusy(true);
    message('Opening Google Drive folder picker…');
    try {
      const config = await api('/api/my-drive/picker-config');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured in Cloudflare.');
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
        .setCallback(async data => {
          if (data.action === window.google.picker.Action.CANCEL) {
            setBusy(false);
            message('Folder selection cancelled.');
            return;
          }
          if (data.action !== window.google.picker.Action.PICKED) return;
          const folderId = data.docs && data.docs[0] && data.docs[0].id;
          if (!folderId) {
            setBusy(false);
            message('No folder was selected.', true);
            return;
          }
          try {
            message('Scanning the selected folder and nested subfolders for TTF, OTF, WOFF and WOFF2 fonts…');
            const result = await api('/api/my-drive/import-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId }) });
            await loadAssets(false);
            message('Folder scan complete: ' + result.importedCount + ' fonts saved, ' + result.skippedCount + ' skipped; ' + result.scannedCount + ' files scanned.');
          } catch (error) {
            message(error.message || 'Folder import failed.', true);
          } finally { setBusy(false); }
        })
        .build();
      picker.setVisible(true);
      message('Choose a Google Drive folder. Nested folders are scanned automatically.');
    } catch (error) {
      message(error.message || 'Google Drive folder picker failed.', true);
      setBusy(false);
    }
  }

  async function uploadFont(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const types = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };
    const response = await fetch('/api/my-drive/assets', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': types[ext] || file.type || 'application/octet-stream', 'X-Asset-Name': encodeURIComponent(file.name) },
      body: file
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.error || ('Could not save ' + file.name));
  }

  function crc32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function extractFontsFromZip(file) {
    if (file.size > 300 * 1024 * 1024) throw new Error('ZIP archive exceeds the 300 MB import limit.');
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
    if (entries === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) throw new Error('ZIP64 archives are not supported yet.');
    if (entries > 1000 || offset + directorySize > eocd) throw new Error('ZIP archive exceeds the supported entry count or has an invalid directory.');
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fonts = [];
    let total = 0;
    for (let index = 0; index < entries; index++) {
      if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP central directory contains an invalid entry.');
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
      const end = offset + 46 + nameLength + extraLength + commentLength;
      if (end > bytes.length) throw new Error('ZIP entry metadata is truncated.');
      const rawName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)).replace(/\\/g, '/');
      offset = end;
      const parts = rawName.split('/');
      const ext = (parts[parts.length - 1].split('.').pop() || '').toLowerCase();
      if (rawName.startsWith('/') || parts.some(part => part === '..') || rawName.endsWith('/')) continue;
      if (((externalAttributes >>> 16) & 0xf000) === 0xa000 || !['ttf', 'otf', 'woff', 'woff2'].includes(ext) || (flags & 1)) continue;
      if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) throw new Error('ZIP64 font entries are not supported yet.');
      if (uncompressedSize > 25 * 1024 * 1024 || total + uncompressedSize > 250 * 1024 * 1024) throw new Error('ZIP font contents exceed the import limits.');
      if (method !== 0 && method !== 8) continue;
      if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('ZIP local file header is invalid.');
      const localFlags = view.getUint16(localOffset + 6, true);
      const localMethod = view.getUint16(localOffset + 8, true);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const localName = decoder.decode(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength)).replace(/\\/g, '/');
      if (localName !== rawName || localMethod !== method || localFlags !== flags) throw new Error('ZIP local and central directory records do not match.');
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const finish = start + compressedSize;
      if (start < 0 || finish > bytes.length) throw new Error('ZIP font data is truncated.');
      const compressed = bytes.slice(start, finish);
      let output;
      if (method === 0) {
        output = compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength);
      } else {
        if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support ZIP deflate extraction. Use a current Chrome version.');
        try {
          output = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        } catch (_) { throw new Error('A font inside this ZIP could not be decompressed.'); }
      }
      if (output.byteLength !== uncompressedSize) throw new Error('Extracted ZIP font size does not match its directory record.');
      if (crc32(new Uint8Array(output)) !== expectedCrc) throw new Error('Extracted ZIP font failed its integrity check.');
      total += output.byteLength;
      const name = parts[parts.length - 1];
      const mime = ext === 'woff' ? 'font/woff' : ext === 'woff2' ? 'font/woff2' : ext === 'otf' ? 'font/otf' : 'font/ttf';
      fonts.push(new File([output], name, { type: mime }));
    }
    return fonts;
  }

  async function importZip(file) {
    if (!file) return;
    setBusy(true);
    try {
      message('Scanning ZIP archive recursively for supported font files…');
      const fonts = await extractFontsFromZip(file);
      if (!fonts.length) throw new Error('No supported TTF, OTF, WOFF or WOFF2 fonts were found in this ZIP.');
      let saved = 0;
      for (const font of fonts) {
        message('Saving font ' + (saved + 1) + ' of ' + fonts.length + ': ' + font.name);
        await uploadFont(font);
        saved++;
      }
      await loadAssets(false);
      message('ZIP import complete: ' + saved + ' font(s) saved permanently to your MAP132 DIGITALS Resources folder.');
    } catch (error) {
      message(error.message || 'ZIP import failed.', true);
    } finally {
      setBusy(false);
      const input = byId('myDriveLocalZip');
      if (input) input.value = '';
    }
  }

  async function loadMoreAssets() {
    if (!nextCursor || busy) return;
    setBusy(true);
    try { await loadAssets(true); }
    catch (error) { message(error.message || 'Could not load more resources.', true); }
    finally { setBusy(false); }
  }

  async function removeAsset(asset) {
    if (!window.confirm('Remove ' + asset.name + ' from your MAP132 saved resources?')) return;
    setBusy(true);
    try {
      await api('/api/my-drive/assets/' + encodeURIComponent(asset.id), { method: 'DELETE' });
      await loadAssets(false);
      message('Resource removed from your MAP132 DIGITALS Resources folder.');
    } catch (error) {
      message(error.message || 'Could not remove this resource.', true);
    } finally { setBusy(false); }
  }

  setupForm && setupForm.addEventListener('submit', event => passwordSubmit(event, '/api/my-drive/lock/setup', 'myDriveSetupPassword'));
  unlockForm && unlockForm.addEventListener('submit', event => passwordSubmit(event, '/api/my-drive/lock/unlock', 'myDriveUnlockPassword'));
  byId('myDriveConnect') && byId('myDriveConnect').addEventListener('click', connectDrive);
  pickerButtons.forEach(button => button.addEventListener('click', openFolderPicker));
  byId('myDriveLocalZip') && byId('myDriveLocalZip').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (file) void importZip(file);
  });
  byId('myDriveLock') && byId('myDriveLock').addEventListener('click', async () => {
    setBusy(true);
    try {
      await api('/api/my-drive/lock', { method: 'POST' });
      unlocked = false; connected = false; window.__map132MyDriveAssets = []; nextCursor = null;
      if (contentPanel) contentPanel.hidden = true;
      if (gate) gate.hidden = false;
      if (setupForm) setupForm.hidden = true;
      if (unlockForm) unlockForm.hidden = false;
      renderAssets([]);
      message('My Drive locked.');
    } catch (error) { message(error.message || 'Could not lock My Drive.', true); }
    finally { setBusy(false); }
  });
  byId('myDriveDisconnect') && byId('myDriveDisconnect').addEventListener('click', async () => {
    if (!window.confirm('Disconnect Google Drive from MAP132? Saved copies remain in your Drive folder, but this app will remove its stored authorization.')) return;
    setBusy(true);
    try {
      await api('/api/my-drive/oauth/logout', { method: 'POST' });
      connected = false; window.__map132MyDriveAssets = []; nextCursor = null;
      renderAssets([]);
      message('Google Drive disconnected. Your saved Drive files remain in your account.');
      await refreshState();
    } catch (error) { message(error.message || 'Could not disconnect Google Drive.', true); }
    finally { setBusy(false); }
  });

  refreshState();
  if (new URLSearchParams(window.location.search).get('myDrive') === 'connected') {
    const clean = new URL(window.location.href);
    clean.searchParams.delete('myDrive');
    history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
  }
})();