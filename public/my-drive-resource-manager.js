(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('myDrivePanel');
  if (!panel || panel.dataset.initialized) return;
  panel.dataset.initialized = 'true';

  const state = { configured: false, unlocked: false, connected: false, busy: false, assets: [], cursor: null, pickerPromise: null };
  const status = $('myDriveStatus');
  const setupForm = $('myDriveSetupForm');
  const unlockForm = $('myDriveUnlockForm');
  const gate = $('myDriveGate');
  const content = $('myDriveContent');
  const items = $('myDriveItems');

  function showMessage(text, error) {
    status.textContent = text || '';
    status.dataset.error = error ? 'true' : 'false';
    if (error && /admin dashboard|sign in/i.test(text)) {
      const link = document.createElement('a');
      link.href = 'index.html#admin';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = ' Open Admin Dashboard';
      link.style.cssText = 'color:var(--gold);margin-left:6px';
      status.appendChild(link);
    }
  }

  async function request(path, options) {
    const response = await fetch(path, Object.assign({
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }, options || {}));
    const type = response.headers.get('content-type') || '';
    const data = type.includes('json') ? await response.json().catch(() => ({})) : {};
    if (!response.ok) {
      const error = new Error(data.error || ('Request failed (' + response.status + ').'));
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function post(path, body) {
    return request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body || {})
    });
  }

  function setBusy(value) {
    state.busy = value;
    ['myDriveConnect', 'myDrivePicker', 'myDriveBrowse', 'myDriveLock', 'myDriveDisconnect'].forEach(id => {
      const button = $(id);
      if (!button) return;
      const requiresConnection = ['myDrivePicker', 'myDriveBrowse', 'myDriveDisconnect'].includes(id);
      button.disabled = value || (requiresConnection && !state.connected);
    });
    const zip = $('myDriveLocalZip');
    if (zip) zip.disabled = value || !state.connected;
    [setupForm, unlockForm].forEach(form => form && form.querySelectorAll('input,button').forEach(el => { el.disabled = value; }));
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function sizeText(value) {
    const bytes = Number(value) || 0;
    return bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
  }

  function assetUrl(asset, action) {
    return '/api/my-drive/assets/' + encodeURIComponent(asset.id) + '/' + (action || 'preview');
  }

  function renderAssets() {
    items.replaceChildren();
    if (!state.assets.length) {
      items.appendChild(make('p', 'mydrive-empty', 'No saved resources yet. Import a Drive font folder or a ZIP archive from your device.'));
    }
    state.assets.forEach(asset => {
      const card = make('article', 'mydrive-item');
      card.appendChild(make('strong', '', asset.name || 'Untitled resource'));
      card.appendChild(make('small', '', String(asset.kind || 'file').toUpperCase() + ' · ' + sizeText(asset.size) + ' · Licence ' + (asset.licenseStatus || 'unverified') + ' · Saved ' + (asset.storedAt ? new Date(asset.storedAt).toLocaleString() : 'date unavailable')));
      if (asset.kind === 'audio') {
        const audio = make('audio'); audio.controls = true; audio.preload = 'none'; audio.src = assetUrl(asset); audio.style.width = '100%'; card.appendChild(audio);
      } else if (asset.kind === 'video') {
        const video = make('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = assetUrl(asset); video.style.width = '100%'; card.appendChild(video);
      } else if (asset.kind === 'image') {
        const img = make('img'); img.src = assetUrl(asset); img.alt = asset.name || 'Saved image'; img.loading = 'lazy'; img.style.cssText = 'max-width:100%;max-height:220px;object-fit:contain'; card.appendChild(img);
      } else if (asset.kind === 'font') {
        const sample = make('div', 'mydrive-font-sample', 'MAP132 DIGITALS · The Final Chapter · తెలుగు');
        sample.dataset.fontAsset = asset.id;
        card.appendChild(sample);
        const preview = make('button', '', 'Preview font');
        preview.type = 'button';
        preview.addEventListener('click', () => previewFont(asset, sample, preview));
        card.appendChild(preview);
      }
      const actions = make('div', 'mydrive-actions');
      const download = make('a', 'mydrive-upload', 'Download');
      download.href = assetUrl(asset, 'download');
      download.setAttribute('download', asset.name || 'resource');
      const remove = make('button', '', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', () => removeAsset(asset));
      actions.append(download, remove);
      card.appendChild(actions);
      items.appendChild(card);
    });
    if (state.cursor) {
      const more = make('button', '', 'Load more saved resources');
      more.type = 'button';
      more.addEventListener('click', loadMore);
      items.appendChild(more);
    }
  }

  async function previewFont(asset, sample, button) {
    button.disabled = true;
    try {
      const response = await fetch(assetUrl(asset), { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('Could not retrieve this font from Google Drive.');
      const blob = await response.blob();
      const family = 'MAP132-' + String(asset.id).replace(/[^a-z0-9]/gi, '');
      const face = new FontFace(family, await blob.arrayBuffer());
      await face.load();
      document.fonts.add(face);
      sample.style.fontFamily = '"' + family + '", sans-serif';
      showMessage('Font preview loaded: ' + asset.name);
    } catch (error) {
      showMessage(error.message || 'Font preview failed.', true);
    } finally { button.disabled = false; }
  }

  async function loadAssets(append) {
    if (!state.connected || !state.unlocked) return;
    const query = '/api/my-drive/assets?limit=50' + (append && state.cursor ? '&cursor=' + encodeURIComponent(state.cursor) : '');
    const data = await request(query);
    const incoming = Array.isArray(data.assets) ? data.assets : [];
    if (append) {
      const ids = new Set(state.assets.map(asset => asset.id));
      state.assets = state.assets.concat(incoming.filter(asset => !ids.has(asset.id)));
    } else {
      state.assets = incoming;
    }
    state.cursor = typeof data.cursor === 'string' && data.cursor ? data.cursor : null;
    renderAssets();
  }

  async function refreshState() {
    try {
      const lock = await request('/api/my-drive/lock/status');
      state.configured = Boolean(lock.configured);
      state.unlocked = Boolean(lock.unlocked);
      gate.hidden = state.unlocked;
      setupForm.hidden = state.configured;
      unlockForm.hidden = !state.configured;
      content.hidden = !state.unlocked;
      if (!state.unlocked) {
        state.connected = false; state.assets = []; state.cursor = null; renderAssets();
        showMessage(state.configured ? 'My Drive is locked. Enter your separate My Drive password.' : 'First-time setup needs an active MAP132 Admin Dashboard sign-in. Create your separate My Drive password after signing in.');
        return;
      }
      const session = await request('/api/my-drive/session');
      state.connected = Boolean(session.connected);
      $('myDriveConnect').textContent = state.connected ? 'Reconnect Google Drive' : 'Connect Google Drive';
      if (state.connected) {
        await loadAssets(false);
        showMessage('Google Drive connected. Saved copies are stored in your MAP132 DIGITALS Resources folder.');
      } else {
        state.assets = []; state.cursor = null; renderAssets();
        showMessage('My Drive unlocked. Connect Google Drive to import and retrieve persistent resources.');
      }
    } catch (error) {
      showMessage(error.message || 'Could not check My Drive status. Refresh and try again.', true);
    } finally { setBusy(false); }
  }

  async function passwordAction(event, path, inputId) {
    event.preventDefault();
    const input = $(inputId);
    setBusy(true);
    showMessage(path.endsWith('/setup') ? 'Creating your separate My Drive password…' : 'Unlocking My Drive…');
    try {
      await post(path, { password: input.value });
      input.value = '';
      await refreshState();
      showMessage(path.endsWith('/setup') ? 'My Drive password created and unlocked.' : 'My Drive unlocked.');
    } catch (error) {
      if (error.status === 403) showMessage('Admin sign-in required before first-time setup. Open Dashboard, sign in, then return here.', true);
      else showMessage(error.message || 'Password action failed.', true);
    } finally { setBusy(false); }
  }

  async function connectDrive() {
    setBusy(true);
    showMessage('Preparing secure Google Drive authorization…');
    try {
      const result = await post('/api/my-drive/oauth/start');
      if (!result.authorizationUrl) throw new Error('Google did not return an authorization page.');
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      showMessage(error.message || 'Could not start Google Drive connection.', true);
      setBusy(false);
    }
  }

  function loadPicker() {
    if (window.google && window.google.picker && window.gapi) return Promise.resolve();
    if (state.pickerPromise) return state.pickerPromise;
    state.pickerPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-map132-google-api]');
      const script = existing || document.createElement('script');
      const ready = () => {
        if (!window.gapi) { reject(new Error('Google API library did not load.')); return; }
        window.gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('Google Picker could not load.')) });
      };
      if (existing) {
        if (window.gapi) ready();
        else existing.addEventListener('load', ready, { once: true });
      } else {
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true; script.defer = true; script.dataset.map132GoogleApi = 'true';
        script.onload = ready;
        script.onerror = () => reject(new Error('Google API library could not load.'));
        document.head.appendChild(script);
      }
    });
    return state.pickerPromise;
  }

  async function openFolderPicker() {
    if (!state.connected || state.busy) return;
    setBusy(true);
    showMessage('Preparing Google Drive folder picker…');
    try {
      const config = await request('/api/my-drive/picker-config');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured in Cloudflare.');
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder');
      const picker = new window.google.picker.PickerBuilder()
        .addView(view).setOAuthToken(config.accessToken).setDeveloperKey(config.developerKey)
        .setAppId(config.appId).setTitle('Choose a font folder to import')
        .setCallback(async data => {
          if (data.action === window.google.picker.Action.CANCEL) {
            setBusy(false); showMessage('Folder selection cancelled.'); return;
          }
          if (data.action !== window.google.picker.Action.PICKED) return;
          const folderId = data.docs && data.docs[0] && data.docs[0].id;
          if (!folderId) { setBusy(false); showMessage('No folder was selected.', true); return; }
          try {
            showMessage('Scanning the selected folder and nested subfolders for TTF, OTF, WOFF and WOFF2 fonts…');
            const result = await post('/api/my-drive/import-folder', { folderId });
            await loadAssets(false);
            showMessage('Folder scan complete: ' + result.importedCount + ' font(s) saved; ' + result.skippedCount + ' skipped; ' + result.scannedCount + ' files scanned.');
          } catch (error) { showMessage(error.message || 'Folder import failed.', true); }
          finally { setBusy(false); }
        }).build();
      picker.setVisible(true);
      showMessage('Choose a Google Drive folder. Nested subfolders will be scanned automatically.');
    } catch (error) {
      showMessage(error.message || 'Google Drive folder picker failed.', true);
      setBusy(false);
    }
  }

  async function uploadFont(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const mime = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' }[ext];
    const response = await fetch('/api/my-drive/assets', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': mime || file.type || 'application/octet-stream', 'X-Asset-Name': encodeURIComponent(file.name) },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || ('Could not save ' + file.name));
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function extractFonts(file) {
    if (file.size > 300 * 1024 * 1024) throw new Error('ZIP archive exceeds the 300 MB limit.');
    const buffer = await file.arrayBuffer(), view = new DataView(buffer), bytes = new Uint8Array(buffer);
    const minEnd = Math.max(0, bytes.length - 22 - 65535);
    let end = -1;
    for (let i = bytes.length - 22; i >= minEnd; i--) if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('ZIP directory is missing or invalid.');
    const count = view.getUint16(end + 10, true), directorySize = view.getUint32(end + 12, true);
    let offset = view.getUint32(end + 16, true);
    if (count === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) throw new Error('ZIP64 archives are not supported yet.');
    if (count > 1000 || offset + directorySize > end) throw new Error('ZIP archive exceeds the supported entry count or has an invalid directory.');
    const decoder = new TextDecoder('utf-8', { fatal: false }), fonts = [];
    let total = 0;
    for (let index = 0; index < count; index++) {
      if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP central directory contains an invalid entry.');
      const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true);
      const expectedCrc = view.getUint32(offset + 16, true), compressedSize = view.getUint32(offset + 20, true);
      const size = view.getUint32(offset + 24, true), nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true), commentLength = view.getUint16(offset + 32, true);
      const attrs = view.getUint32(offset + 38, true), localOffset = view.getUint32(offset + 42, true);
      const next = offset + 46 + nameLength + extraLength + commentLength;
      if (next > bytes.length) throw new Error('ZIP entry metadata is truncated.');
      const rawName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)).replace(/\\/g, '/');
      offset = next;
      const parts = rawName.split('/'), name = parts[parts.length - 1], ext = (name.split('.').pop() || '').toLowerCase();
      if (rawName.startsWith('/') || parts.some(part => part === '..') || rawName.endsWith('/') || ((attrs >>> 16) & 0xf000) === 0xa000) continue;
      if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext) || (flags & 1)) continue;
      if (compressedSize === 0xffffffff || size === 0xffffffff || localOffset === 0xffffffff) throw new Error('ZIP64 font entries are not supported yet.');
      if (size > 25 * 1024 * 1024 || total + size > 250 * 1024 * 1024) throw new Error('ZIP font contents exceed the per-file or total import limit.');
      if (method !== 0 && method !== 8) continue;
      if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('ZIP local file header is invalid.');
      const localFlags = view.getUint16(localOffset + 6, true), localMethod = view.getUint16(localOffset + 8, true);
      const localNameLength = view.getUint16(localOffset + 26, true), localExtraLength = view.getUint16(localOffset + 28, true);
      const localName = decoder.decode(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength)).replace(/\\/g, '/');
      if (localName !== rawName || localMethod !== method || localFlags !== flags) throw new Error('ZIP local and central directory records do not match.');
      const start = localOffset + 30 + localNameLength + localExtraLength, finish = start + compressedSize;
      if (finish > bytes.length) throw new Error('ZIP font data is truncated.');
      const compressed = bytes.slice(start, finish);
      let output;
      if (method === 0) output = compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength);
      else {
        if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support ZIP deflate extraction. Use a current Chrome version.');
        try { output = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); }
        catch (_) { throw new Error('A font inside this ZIP could not be decompressed.'); }
      }
      if (output.byteLength !== size || crc32(new Uint8Array(output)) !== expectedCrc) throw new Error('Extracted ZIP font failed its size or CRC integrity check.');
      total += output.byteLength;
      const mime = ext === 'woff' ? 'font/woff' : ext === 'woff2' ? 'font/woff2' : ext === 'otf' ? 'font/otf' : 'font/ttf';
      fonts.push(new File([output], name, { type: mime }));
    }
    return fonts;
  }

  async function importZip(file) {
    if (!file || state.busy || !state.connected) return;
    setBusy(true);
    try {
      showMessage('Scanning ZIP archive recursively for TTF, OTF, WOFF and WOFF2 files…');
      const fonts = await extractFonts(file);
      if (!fonts.length) throw new Error('No supported font files were found in this ZIP. Unsupported files are skipped.');
      let saved = 0;
      for (const font of fonts) {
        showMessage('Saving font ' + (saved + 1) + ' of ' + fonts.length + ': ' + font.name);
        await uploadFont(font);
        saved++;
      }
      await loadAssets(false);
      showMessage('ZIP import complete: ' + saved + ' font(s) saved permanently to your MAP132 DIGITALS Resources folder.');
    } catch (error) { showMessage(error.message || 'ZIP import failed.', true); }
    finally {
      setBusy(false);
      const input = $('myDriveLocalZip');
      if (input) input.value = '';
    }
  }

  async function loadMore() {
    if (!state.cursor || state.busy) return;
    setBusy(true);
    try { await loadAssets(true); }
    catch (error) { showMessage(error.message || 'Could not load more saved resources.', true); }
    finally { setBusy(false); }
  }

  async function removeAsset(asset) {
    if (state.busy || !window.confirm('Remove ' + asset.name + ' from your MAP132 saved resources?')) return;
    setBusy(true);
    try {
      await request('/api/my-drive/assets/' + encodeURIComponent(asset.id), { method: 'DELETE' });
      await loadAssets(false);
      showMessage('Resource removed from your MAP132 DIGITALS Resources folder.');
    } catch (error) { showMessage(error.message || 'Could not remove this resource.', true); }
    finally { setBusy(false); }
  }

  function bindPasswordVisibility(inputId, buttonId) {
    const input = $(inputId), button = $(buttonId);
    if (!input || !button) return;
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      button.setAttribute('title', visible ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', String(visible));
      const open = button.querySelector('[data-eye-open]');
      const closed = button.querySelector('[data-eye-closed]');
      if (open) open.hidden = visible;
      if (closed) closed.hidden = !visible;
      input.focus({ preventScroll: true });
    });
  }
  bindPasswordVisibility('myDriveSetupPassword', 'myDriveSetupToggle');
  bindPasswordVisibility('myDriveUnlockPassword', 'myDriveUnlockToggle');

  setupForm.addEventListener('submit', event => passwordAction(event, '/api/my-drive/lock/setup', 'myDriveSetupPassword'));
  unlockForm.addEventListener('submit', event => passwordAction(event, '/api/my-drive/lock/unlock', 'myDriveUnlockPassword'));
  $('myDriveConnect').addEventListener('click', connectDrive);
  $('myDrivePicker').addEventListener('click', openFolderPicker);
  $('myDriveBrowse').addEventListener('click', openFolderPicker);
  $('myDriveLocalZip').addEventListener('change', event => { const file = event.target.files && event.target.files[0]; if (file) void importZip(file); });
  $('myDriveLock').addEventListener('click', async () => {
    setBusy(true);
    try {
      await post('/api/my-drive/lock');
      state.unlocked = false; state.connected = false; state.assets = []; state.cursor = null;
      gate.hidden = false; content.hidden = true; setupForm.hidden = true; unlockForm.hidden = false; renderAssets();
      showMessage('My Drive locked. Enter your separate password to unlock it again.');
    } catch (error) { showMessage(error.message || 'Could not lock My Drive.', true); }
    finally { setBusy(false); }
  });
  $('myDriveDisconnect').addEventListener('click', async () => {
    if (!window.confirm('Disconnect Google Drive? Saved copies remain in your Google Drive account, but MAP132 will remove its stored authorization.')) return;
    setBusy(true);
    try {
      await post('/api/my-drive/oauth/logout');
      state.connected = false; state.assets = []; state.cursor = null; renderAssets();
      showMessage('Google Drive disconnected. Your saved files remain in your account.');
      await refreshState();
    } catch (error) { showMessage(error.message || 'Could not disconnect Google Drive.', true); }
    finally { setBusy(false); }
  });
  const refreshButton = $('myDriveRefresh');
  if (refreshButton) refreshButton.addEventListener('click', () => { setBusy(true); refreshState(); });

  const params = new URLSearchParams(window.location.search);
  if (params.get('myDrive') === 'connected' || params.get('myDrive') === 'cancelled') {
    const tab = document.querySelector('[data-resource-view="my-drive"]');
    if (tab) tab.click();
    const clean = new URL(window.location.href);
    clean.searchParams.delete('myDrive');
    window.history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
  }
  refreshState();
})();