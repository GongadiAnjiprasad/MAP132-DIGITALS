(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('myDrivePanel');
  if (!panel || panel.dataset.initialized) return;
  panel.dataset.initialized = 'true';

  const state = { authenticated: false, connected: false, busy: false, refreshing: false, assets: [], cursor: null, pickerPromise: null };
  const status = $('myDriveStatus');
  const loginLink = $('myDriveLogin');
  const logoutButton = $('myDriveLogout');
  const gate = $('myDriveGate');
  const content = $('myDriveContent');
  const items = $('myDriveItems');

  function showMessage(text, error) {
    status.textContent = text || '';
    status.dataset.error = error ? 'true' : 'false';
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
    ['myDriveConnect', 'myDrivePicker', 'myDriveLogout'].forEach(id => {
      const button = $(id);
      if (!button) return;
      const requiresConnection = id === 'myDrivePicker';
      button.disabled = value || (requiresConnection && !state.connected);
    });
    const zip = $('myDriveLocalZip');
    if (zip) zip.disabled = value || !state.connected;
    const zipButton = $('myDriveChooseZip');
    if (zipButton) zipButton.disabled = value || !state.connected;
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
      items.appendChild(make('p', 'mydrive-empty', 'Choose one Drive folder to build your private category library.'));
      return;
    }
    const categories = ['Sound Effects','Wedding','Birthday','Trailer BGMs','Plugins','Fonts','Images','Videos','Other'];
    categories.forEach(category => {
      const grouped = state.assets.filter(asset => (asset.category || 'Other') === category);
      if (!grouped.length) return;
      const section = make('section', 'mydrive-category');
      section.appendChild(make('h3', '', category + ' · ' + grouped.length));
      const grid = make('div', 'mydrive-items-grid');
      grouped.forEach(asset => {
        const card = make('article', 'mydrive-item');
        card.appendChild(make('strong', '', asset.name || 'Untitled resource'));
        card.appendChild(make('small', '', String(asset.kind || 'file').toUpperCase() + ' · ' + sizeText(asset.size) + ' · Licence ' + (asset.licenseStatus || 'unverified')));
        if (asset.kind === 'audio') { const audio = make('audio'); audio.controls = true; audio.preload = 'none'; audio.src = assetUrl(asset); audio.style.width = '100%'; card.appendChild(audio); }
        else if (asset.kind === 'video') { const video = make('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = assetUrl(asset); video.style.width = '100%'; card.appendChild(video); }
        else if (asset.kind === 'image') { const img = make('img'); img.src = assetUrl(asset); img.alt = asset.name || 'Saved image'; img.loading = 'lazy'; img.style.cssText = 'max-width:100%;max-height:220px;object-fit:contain'; card.appendChild(img); }
        else if (asset.kind === 'font') { const sample = make('div', 'mydrive-font-sample', 'MAP132 DIGITALS · The Final Chapter · తెలుగు'); sample.dataset.fontAsset = asset.id; card.appendChild(sample); const preview = make('button', '', 'Preview font'); preview.type = 'button'; preview.addEventListener('click', () => previewFont(asset, sample, preview)); card.appendChild(preview); }
        else if (asset.kind === 'template' || asset.kind === 'archive' || asset.kind === 'other') { const preview = make('div', 'mydrive-generic-preview'); preview.appendChild(make('strong', '', 'Creative resource preview')); preview.appendChild(make('span', '', (asset.name.split('.').pop() || 'FILE').toUpperCase() + ' · ' + (asset.contentType || 'application file'))); preview.appendChild(make('p', '', 'This editing-project format cannot be rendered directly in the browser. Download it to open in its compatible editing app.')); card.appendChild(preview); }
        const actions = make('div', 'mydrive-actions');
        const download = make('a', 'mydrive-upload', 'Download'); download.href = assetUrl(asset, 'download'); download.setAttribute('download', asset.name || 'resource');
        const remove = make('button', '', 'Remove'); remove.type = 'button'; remove.addEventListener('click', () => removeAsset(asset));
        actions.append(download, remove); card.appendChild(actions); grid.appendChild(card);
      });
      section.appendChild(grid); items.appendChild(section);
    });
    if (state.cursor) { const more = make('button', '', 'Load more saved resources'); more.type = 'button'; more.addEventListener('click', loadMore); items.appendChild(more); }
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
    if (!state.connected || !state.authenticated) return;
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
    if (state.refreshing) return;
    state.refreshing = true;
    try {
      const session = await request('/api/admin/session');
      state.authenticated = Boolean(session.authenticated);
      gate.hidden = state.authenticated;
      content.hidden = !state.authenticated;
      loginLink.hidden = state.authenticated;
      logoutButton.hidden = !state.authenticated;
      if (!state.authenticated) {
        state.connected = false; state.assets = []; state.cursor = null; renderAssets();
        showMessage('Login to the MAP132 Admin Dashboard to open My Drive.');
        return;
      }
      const drive = await request('/api/my-drive/session');
      state.connected = Boolean(drive.connected);
      $('myDriveConnect').textContent = state.connected ? 'Reconnect Google Drive' : 'Connect Google Drive';
      if (state.connected) {
        await loadAssets(false);
        showMessage('Google Drive connected. Your saved resources are ready.');
      } else {
        state.assets = []; state.cursor = null; renderAssets();
        showMessage('You are logged in. Connect Google Drive to import and retrieve resources.');
      }
    } catch (error) {
      state.authenticated = false;
      gate.hidden = false; content.hidden = true;
      loginLink.hidden = false; logoutButton.hidden = true;
      state.connected = false; state.assets = []; state.cursor = null; renderAssets();
      showMessage(error.status === 401 ? 'Login to the MAP132 Admin Dashboard to open My Drive.' : (error.message || 'Admin login required. Sign in and refresh this page.'), true);
    } finally { state.refreshing = false; setBusy(false); }
  }

  async function logout() {
    if (state.busy) return;
    setBusy(true);
    try {
      await post('/api/admin/logout');
      state.authenticated = false; state.connected = false; state.assets = []; state.cursor = null;
      gate.hidden = false; content.hidden = true; loginLink.hidden = false; logoutButton.hidden = true;
      renderAssets();
      showMessage('Logged out. My Drive is now locked.');
    } catch (error) {
      showMessage(error.message || 'Could not log out. Please retry.', true);
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

  function classifyResource(fileName, relativePath) {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const supported = ['ttf','otf','woff','woff2','mp3','wav','aac','m4a','ogg','flac','mp4','mov','webm','m4v','jpg','jpeg','png','webp','gif','avif','svg','zip','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'];
    if (!supported.includes(ext)) return null;
    const text = (String(relativePath || '') + ' ' + fileName).toLowerCase().replace(/[_-]+/g, ' ');
    const has = words => words.some(word => text.includes(word));
    const font = ['ttf','otf','woff','woff2'].includes(ext), audio = ['mp3','wav','aac','m4a','ogg','flac'].includes(ext);
    const video = ['mp4','mov','webm','m4v'].includes(ext), image = ['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext);
    const plugin = ['aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'].includes(ext);
    if (has(['sound effect','sound effects','sfx','whoosh','riser','impact','boom','transition','heartbeat','foley'])) return { category:'Sound Effects', kind:'audio' };
    if (has(['wedding','marriage','pelli'])) return { category:'Wedding', kind:font?'font':audio?'audio':video?'video':image?'image':'template' };
    if (has(['birthday','bday','birth day'])) return { category:'Birthday', kind:font?'font':audio?'audio':video?'video':image?'image':'template' };
    if (has(['trailer bgm','trailer music','trailer','background music','bgm','cinematic score'])) return { category:'Trailer BGMs', kind:audio?'audio':font?'font':video?'video':image?'image':'archive' };
    if (has(['plugin','plugins','preset pack','presets'])) return { category:'Plugins', kind:plugin?'template':'archive' };
    if (font) return { category:'Fonts', kind:'font' };
    if (audio) return { category:'Sound Effects', kind:'audio' };
    if (video) return { category:'Videos', kind:'video' };
    if (image) return { category:'Images', kind:'image' };
    if (plugin || ext === 'zip') return { category:'Plugins', kind:'archive' };
    return null;
  }

  async function syncSelectedFolder(rootId, rootName) {
    const queue = [{ id:rootId, name:rootName, path:rootName }], visited = new Set(), candidates = [];
    let scanned = 0;
    while (queue.length && scanned < 5000) {
      const folder = queue.shift();
      if (visited.has(folder.id)) continue;
      visited.add(folder.id);
      let pageToken = '';
      do {
        const url = new URL('/api/my-drive/files', window.location.origin);
        url.searchParams.set('parentId', folder.id);
        if (pageToken) url.searchParams.set('pageToken', pageToken);
        const page = await request(url.toString());
        for (const file of page.files || []) {
          scanned++;
          const path = folder.path + '/' + file.name;
          if (file.mimeType === 'application/vnd.google-apps.folder') queue.push({ id:file.id, name:file.name, path });
          else {
            const classification = classifyResource(file.name, path);
            if (classification) candidates.push({ id:file.id, name:file.name, path, category:classification.category, kind:classification.kind, size:Number(file.size||0), mimeType:file.mimeType });
          }
          if (scanned >= 5000) break;
        }
        pageToken = page.nextPageToken || '';
      } while (pageToken && scanned < 5000);
      showMessage('Scanning selected folder… ' + scanned + ' item(s) checked; ' + candidates.length + ' supported.');
    }
    let saved = 0, skipped = 0, failed = 0;
    for (let index = 0; index < candidates.length; index++) {
      const file = candidates[index];
      if (file.size > 100 * 1024 * 1024) { skipped++; continue; }
      try {
        showMessage('Saving ' + (index + 1) + ' of ' + candidates.length + ' · ' + file.category + ' · ' + file.name);
        const response = await fetch('/api/my-drive/download/' + encodeURIComponent(file.id), { credentials:'same-origin', cache:'no-store' });
        if (!response.ok) throw new Error('Could not download ' + file.name + ' from the selected folder.');
        const bytes = await response.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > 100 * 1024 * 1024) { skipped++; continue; }
        if (file.name.toLowerCase().endsWith('.zip')) {
          const extracted = await extractZipResources(new File([bytes],file.name,{type:'application/zip'}),0,{entries:0,bytes:0});
          skipped += extracted.issues.length;
          for (const asset of extracted.assets) {
            const result = await uploadResource(asset.file,asset.category,file.path+'/'+asset.path);
            if (result.duplicate) skipped++; else saved++;
          }
        } else {
          const upload = await fetch('/api/my-drive/assets', { method:'POST', credentials:'same-origin', headers:{ 'Content-Type':file.mimeType || 'application/octet-stream', 'X-Asset-Name':encodeURIComponent(file.name), 'X-Asset-Category':file.category, 'X-Asset-Source-Path':encodeURIComponent(file.path) }, body:bytes });
          const result = await upload.json().catch(() => ({}));
          if (!upload.ok) throw new Error(result.error || 'Could not save ' + file.name + '.');
          if (result.duplicate) skipped++; else saved++;
        }
      } catch (error) { failed++; }
    }
    await loadAssets(false);
    showMessage('Folder sync complete: ' + saved + ' saved, ' + skipped + ' skipped/duplicate, ' + failed + ' failed. Only the selected folder was scanned.');
  }

  async function openFolderPicker() {
    if (!state.connected || state.busy) return;
    setBusy(true); showMessage('Preparing Google Drive folder picker…');
    try {
      const config = await request('/api/my-drive/picker-config');
      if (!config.pickerEnabled || !config.developerKey) throw new Error('Google Picker API key is not configured in Cloudflare.');
      await loadPicker();
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder');
      const picker = new window.google.picker.PickerBuilder().addView(view).setOAuthToken(config.accessToken).setDeveloperKey(config.developerKey).setAppId(config.appId).setTitle('Choose one folder for MAP132 Workspace')
        .setCallback(async data => {
          if (data.action === window.google.picker.Action.CANCEL) { setBusy(false); showMessage('Folder selection cancelled.'); return; }
          if (data.action !== window.google.picker.Action.PICKED) return;
          const folder = data.docs && data.docs[0];
          if (!folder || !folder.id) { setBusy(false); showMessage('No folder was selected.', true); return; }
          try { await syncSelectedFolder(folder.id, String(folder.name || 'Selected Drive folder')); }
          catch (error) { showMessage(error.message || 'Folder sync failed.', true); }
          finally { setBusy(false); }
        }).build();
      picker.setVisible(true);
      showMessage('Choose one folder. Only that folder and its nested folders will be scanned.');
    } catch (error) { showMessage(error.message || 'Google Drive folder picker failed.', true); setBusy(false); }
  }
  async function uploadResource(file, category, relativePath) {
    const response = await fetch('/api/my-drive/assets', {
      method: 'POST', credentials: 'same-origin',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Asset-Name': encodeURIComponent(file.name),
        'X-Asset-Category': category || 'Other',
        'X-Asset-Source-Path': encodeURIComponent(relativePath || file.name)
      },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || ('Could not save ' + file.name));
    return data;
  }

  function classifyZipResource(path) {
    const name = path.split('/').pop() || path;
    const ext = (name.split('.').pop() || '').toLowerCase();
    const supported = ['ttf','otf','woff','woff2','mp3','wav','aac','m4a','ogg','flac','mp4','mov','webm','m4v','jpg','jpeg','png','webp','gif','avif','svg','aep','mogrt','prproj','prfpset','ffx','cube','look','drx','setting','preset','prm'];
    if (!supported.includes(ext)) return null;
    const text = path.toLowerCase().replace(/[_-]+/g, ' ');
    const has = words => words.some(word => text.includes(word));
    const font = ['ttf','otf','woff','woff2'].includes(ext);
    const audio = ['mp3','wav','aac','m4a','ogg','flac'].includes(ext);
    const video = ['mp4','mov','webm','m4v'].includes(ext);
    const image = ['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext);
    if (has(['sound effect','sound effects','sfx','whoosh','riser','impact','boom','transition','heartbeat','foley'])) return { category:'Sound Effects', kind:'audio' };
    if (has(['wedding','marriage','pelli'])) return { category:'Wedding', kind:font?'font':audio?'audio':video?'video':image?'image':'template' };
    if (has(['birthday','bday','birth day'])) return { category:'Birthday', kind:font?'font':audio?'audio':video?'video':image?'image':'template' };
    if (has(['trailer bgm','trailer music','trailer','background music','bgm','cinematic score'])) return { category:'Trailer BGMs', kind:audio?'audio':font?'font':video?'video':image?'image':'template' };
    if (has(['plugin','plugins','preset pack','presets'])) return { category:'Plugins', kind:'template' };
    if (font) return { category:'Fonts', kind:'font' };
    if (audio) return { category:'Sound Effects', kind:'audio' };
    if (video) return { category:'Videos', kind:'video' };
    if (image) return { category:'Images', kind:'image' };
    return { category:'Plugins', kind:'template' };
  }

  async function extractZipResources(file, depth, budget) {
    depth = depth || 0;
    budget = budget || { entries:0, bytes:0 };
    if (depth > 4) throw new Error('Nested ZIP depth exceeds the safe limit of 4 levels.');
    if (file.size > 100 * 1024 * 1024) throw new Error('ZIP archive exceeds the 100 MB device import limit.');
    const buffer = await file.arrayBuffer(), view = new DataView(buffer), bytes = new Uint8Array(buffer);
    const minEnd = Math.max(0, bytes.length - 22 - 65535);
    let end = -1;
    for (let i = bytes.length - 22; i >= minEnd; i--) if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('ZIP directory is missing or invalid.');
    const disk = view.getUint16(end + 4, true), centralDisk = view.getUint16(end + 6, true);
    const diskEntries = view.getUint16(end + 8, true), count = view.getUint16(end + 10, true);
    const directorySize = view.getUint32(end + 12, true), directoryOffset = view.getUint32(end + 16, true);
    if (disk || centralDisk || diskEntries !== count || count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) throw new Error('Multi-disk and ZIP64 archives are not supported.');
    if (count > 2000 || directoryOffset + directorySize > end) throw new Error('ZIP archive exceeds the supported entry count or has an invalid directory.');
    const decoder = new TextDecoder('utf-8', { fatal:false }), assets = [], issues = [];
    let offset = directoryOffset, localTotal = 0;
    for (let index = 0; index < count; index++) {
      if (offset + 46 > directoryOffset + directorySize || view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP central directory contains an invalid entry.');
      const madeBy=view.getUint16(offset+4,true), flags=view.getUint16(offset+8,true), method=view.getUint16(offset+10,true);
      const expectedCrc=view.getUint32(offset+16,true), compressedSize=view.getUint32(offset+20,true), size=view.getUint32(offset+24,true);
      const nameLength=view.getUint16(offset+28,true), extraLength=view.getUint16(offset+30,true), commentLength=view.getUint16(offset+32,true);
      const attrs=view.getUint32(offset+38,true), localOffset=view.getUint32(offset+42,true);
      const nameStart=offset+46, next=nameStart+nameLength+extraLength+commentLength;
      if(next>directoryOffset+directorySize) throw new Error('ZIP entry metadata is truncated.');
      const rawName=decoder.decode(bytes.subarray(nameStart,nameStart+nameLength)).replace(/\\/g,'/');
      offset=next;
      const parts=rawName.split('/'), name=parts[parts.length-1]||'';
      const unixMode=(madeBy>>8)===3?attrs>>>16:0;
      if(!rawName||rawName.startsWith('/')||/^[a-zA-Z]:/.test(rawName)||parts.some(part=>part==='..')||rawName.endsWith('/')||(unixMode&0xf000)===0xa000||(flags&1)) { issues.push(rawName+' · unsafe, encrypted or directory entry skipped'); continue; }
      if(method!==0&&method!==8){issues.push(rawName+' · unsupported compression skipped');continue;}
      if(compressedSize===0xffffffff||size===0xffffffff||localOffset===0xffffffff) throw new Error('ZIP64 entries are not supported.');
      const ratio=compressedSize>0?size/compressedSize:(size?Infinity:1);
      if(size>25*1024*1024||ratio>100||budget.entries+1>2000||budget.bytes+size>250*1024*1024){issues.push(rawName+' · archive safety limit skipped');continue;}
      budget.entries++;budget.bytes+=size;localTotal+=size;
      if(localOffset+30>bytes.length||view.getUint32(localOffset,true)!==0x04034b50) throw new Error('ZIP local file header is invalid.');
      const localFlags=view.getUint16(localOffset+6,true),localMethod=view.getUint16(localOffset+8,true);
      const localNameLength=view.getUint16(localOffset+26,true),localExtraLength=view.getUint16(localOffset+28,true);
      const localName=decoder.decode(bytes.subarray(localOffset+30,localOffset+30+localNameLength)).replace(/\\/g,'/');
      if(localName!==rawName||localMethod!==method||localFlags!==flags) throw new Error('ZIP local and central directory records do not match.');
      const dataStart=localOffset+30+localNameLength+localExtraLength,dataEnd=dataStart+compressedSize;
      if(dataEnd>bytes.length) throw new Error('ZIP file data is truncated.');
      const compressed=bytes.slice(dataStart,dataEnd);
      let output;
      if(method===0) output=compressed.buffer.slice(compressed.byteOffset,compressed.byteOffset+compressed.byteLength);
      else {
        if(typeof DecompressionStream==='undefined') throw new Error('This browser does not support safe ZIP deflate extraction. Update Chrome and retry.');
        output=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      }
      const outBytes=new Uint8Array(output);
      if(outBytes.byteLength!==size||crc32(outBytes)!==expectedCrc) throw new Error('ZIP entry failed size or CRC integrity validation.');
      const ext=(name.split('.').pop()||'').toLowerCase();
      if(ext==='zip'){
        const nested=await extractZipResources(new File([outBytes],name,{type:'application/zip'}),depth+1,budget);
        nested.assets.forEach(asset=>assets.push({...asset,path:rawName+'/'+asset.path}));
        issues.push(...nested.issues);
      } else {
        const classification=classifyZipResource(rawName);
        if(!classification){issues.push(rawName+' · unsupported file skipped');continue;}
        const mimeMap={ttf:'font/ttf',otf:'font/otf',woff:'font/woff',woff2:'font/woff2',mp3:'audio/mpeg',wav:'audio/wav',aac:'audio/aac',m4a:'audio/mp4',ogg:'audio/ogg',flac:'audio/flac',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',m4v:'video/x-m4v',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',svg:'image/svg+xml'};
        assets.push({file:new File([outBytes],name,{type:mimeMap[ext]||'application/octet-stream'}),category:classification.category,path:rawName});
      }
    }
    return {assets,issues};
  }

  async function importZip(file) {
    if (!file || state.busy) return;
    if (!state.connected) { showMessage('Connect Google Drive first so extracted files can be saved into MAP132 Workspace.', true); return; }
    setBusy(true);
    try {
      showMessage('Scanning ZIP and nested ZIP archives for supported resources…');
      const extracted = await extractZipResources(file,0,{entries:0,bytes:0});
      if (!extracted.assets.length) throw new Error('No supported resources were found in this ZIP. Unsupported or unsafe entries were skipped.');
      let saved=0,duplicates=0;
      for(let index=0;index<extracted.assets.length;index++){
        const asset=extracted.assets[index];
        showMessage('Extracting and saving '+(index+1)+' of '+extracted.assets.length+' · '+asset.category+' · '+asset.file.name);
        const result=await uploadResource(asset.file,asset.category,asset.path);
        if(result.duplicate)duplicates++;else saved++;
      }
      await loadAssets(false);
      showMessage('ZIP import complete: '+saved+' saved, '+duplicates+' duplicate(s), '+extracted.issues.length+' skipped item(s). Nested ZIPs were scanned automatically.');
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
      showMessage('Resource removed from your MAP132 Workspace folder.');
    } catch (error) { showMessage(error.message || 'Could not remove this resource.', true); }
    finally { setBusy(false); }
  }

  $('myDriveConnect').addEventListener('click', connectDrive);
  $('myDrivePicker').addEventListener('click', openFolderPicker);
  $('myDriveChooseZip').addEventListener('click', () => $('myDriveLocalZip').click());
  $('myDriveLocalZip').addEventListener('change', event => { const file = event.target.files && event.target.files[0]; if (file) void importZip(file); });
  if (logoutButton) logoutButton.addEventListener('click', logout);

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
  window.addEventListener('focus', () => { if (!state.busy) refreshState(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !state.busy) refreshState(); });
  refreshState();
})();
