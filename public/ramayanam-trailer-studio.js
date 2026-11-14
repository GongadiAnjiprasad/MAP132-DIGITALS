(() => {
  'use strict';
  const panel = document.getElementById('ramayanamStudio');
  const grid = document.getElementById('rtLibraryAssets');
  if (!panel || !grid || panel.dataset.playerReady) return;
  panel.dataset.playerReady = 'true';
  const title = document.getElementById('rtDownloadTitle');
  const description = document.getElementById('rtDownloadDescription');
  const status = document.getElementById('rtLibraryStatus');
  const genreButtons = [...panel.querySelectorAll('[data-rt-genre]')];
  const sceneButtons = [...panel.querySelectorAll('[data-rt-scene]')];

  // Official Mixkit CDN preview and download endpoints. Only tracks with a
  // known official asset ID are listed; preview and download are the same work.
  const tracks = {
    drums: { title:'Epical Drums 01', artist:'Grigoriy Nuzhny', duration:'1:46', id:'676', tags:'Percussion trailer · dramatic action', page:'https://mixkit.co/free-stock-music/sound-elements/' },
    fright: { title:'Fright Night', artist:'Michael Ramir C.', duration:'1:41', id:'871', tags:'Film score · mysterious · cinematic thriller', page:'https://mixkit.co/free-stock-music/mood/suspenseful/' },
    dream: { title:'Beautiful Dream', artist:'Diego Nava', duration:'1:37', id:'493', tags:'Romantic · melancholic · acoustic guitar', page:'https://mixkit.co/free-stock-music/mood/romantic/' },
    silent: { title:'Silent Descent', artist:'Eugenio Mininni', duration:'2:40', id:'614', tags:'Reflective · melancholic · piano and strings', page:'https://mixkit.co/free-stock-music/mood/emotional/' }
  };
  const audioUrl = track => 'https://assets.mixkit.co/music/preview/mixkit-' + track.slug + '-' + track.id + '.mp3';
  tracks.drums.slug='epical-drums-01'; tracks.fright.slug='fright-night';
  tracks.dream.slug='beautiful-dream'; tracks.silent.slug='silent-descent';
  const library = {
    action:{title:'Action / Epic',desc:'Hero entries, fights and battle builds.',items:['drums','fright']},
    romance:{title:'Romance',desc:'Love themes, longing and reunion.',items:['dream','silent']},
    thriller:{title:'Thriller / Suspense',desc:'Villain reveals, tension and confrontation.',items:['fright','drums']},
    emotional:{title:'Emotional',desc:'Separation, sorrow and heartfelt moments.',items:['silent','dream']},
    horror:{title:'Horror',desc:'Eerie atmosphere and fear builds.',items:['fright']},
    comedy:{title:'Comedy',desc:'No verified comedy preview is in this starter set yet.',items:[]},
    devotional:{title:'Devotional / Mythological',desc:'No verified devotional preview is in this starter set yet.',items:[]},
    epic:{title:'Epic / Heroic',desc:'Orchestral percussion and heroic elevation.',items:['drums','silent']},
    adventure:{title:'Adventure / Fantasy',desc:'Journey and atmospheric exploration.',items:['drums','silent']}
  };
  const sceneMap = {
    'hero-intro':['action','epic','adventure'], 'villain-intro':['thriller','horror','epic'],
    'heroine-intro':['romance','emotional'], 'hero-villain':['action','thriller','epic'],
    'hero-heroine':['romance','emotional'], 'villain-heroine':['thriller','emotional','horror'],
    'hanuman-sena':['adventure','epic','action'], emotional:['emotional','romance'],
    'action-climax':['action','epic','thriller']
  };
  let currentAudio=null, currentButton=null, activeGenre='action';
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function stopCurrent() {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime=0; currentAudio.removeAttribute('src'); currentAudio.load(); }
    if (currentButton) { currentButton.textContent='▶ Preview'; currentButton.setAttribute('aria-pressed','false'); }
    currentAudio=null; currentButton=null;
  }
  function card(key) {
    const track=tracks[key], preview='https://assets.mixkit.co/music/preview/mixkit-'+track.slug+'-'+track.id+'.mp3';
    const download='https://assets.mixkit.co/music/download/mixkit-'+track.slug+'-'+track.id+'.mp3';
    return '<article class="rt-audio-card"><strong>'+escapeHtml(track.title)+'</strong><div class="rt-audio-meta">'+escapeHtml(track.artist)+' · '+track.duration+'<br>'+escapeHtml(track.tags)+'<br>Mixkit · Free Music License</div><div class="rt-track-controls"><button type="button" class="rt-preview-button" data-rt-preview="'+key+'" data-preview-url="'+preview+'">▶ Preview</button><a class="rt-download-link" href="'+download+'" download="'+track.slug+'.mp3" rel="noopener">Download</a></div><audio class="rt-inline-audio" preload="none" hidden></audio><a class="rt-source-link" href="'+track.page+'" target="_blank" rel="noopener noreferrer">Track source & licence ↗</a></article>';
  }
  function render(keys, heading, detail) {
    stopCurrent(); title.textContent=heading; description.textContent=detail;
    const unique=[...new Set(keys)].filter(key=>tracks[key]);
    grid.innerHTML=unique.length?unique.map(card).join(''):'<p class="rt-empty-state">This folder has no track with a verified official preview and download URL yet. It will stay empty until a suitable track is verified.</p>';
    status.textContent=unique.length+' verified Mixkit preview(s) · same track download available.';
    grid.querySelectorAll('[data-rt-preview]').forEach(button=>button.addEventListener('click',()=>{
      const audio=button.closest('.rt-audio-card').querySelector('audio');
      if(currentButton===button && currentAudio && !currentAudio.paused){stopCurrent();return;}
      stopCurrent(); currentAudio=audio; currentButton=button; audio.src=button.dataset.previewUrl;
      button.textContent='Ⅱ Pause'; button.setAttribute('aria-pressed','true');
      audio.addEventListener('ended',()=>{if(currentAudio===audio)stopCurrent();},{once:true});
      audio.addEventListener('error',()=>{if(currentAudio===audio){stopCurrent();status.textContent='Preview could not load. Try the official source page.';}},{once:true});
      audio.play().catch(()=>{if(currentAudio===audio)stopCurrent();status.textContent='Preview playback was blocked. Tap Preview again or open the official source.';});
    }));
  }
  function selectGenre(id) {
    const item=library[id]; if(!item)return; activeGenre=id;
    genreButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtGenre===id));
    sceneButtons.forEach(button=>button.classList.remove('active'));
    render(item.items,item.title+' · Audio',item.desc);
  }
  function selectScene(id) {
    const related=sceneMap[id]||['action']; const names={
      'opening-hook':'Opening / Hook','hero-intro':'Hero Intro','villain-intro':'Villain Intro','heroine-intro':'Heroine Intro',
      'hero-villain':'Hero vs Villain','hero-heroine':'Hero vs Heroine','villain-heroine':'Ashokavanam',
      'hanuman-sena':'Hanuman Sena',emotional:'Separation','action-climax':'Action / Climax'
    };
    genreButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtGenre===related[0]));
    sceneButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtScene===id));
    const types=['BGM','Dialogue','SFX'];
    const grouped=Object.fromEntries(types.map(type=>[type,sceneAssets(id,type)]));
    const missing=types.filter(type=>!grouped[type].length);
    stopCurrent(); title.textContent=names[id]+' · Audio Match';
    description.textContent='Scene relevance is checked from the saved asset name/path. Only actual audio files are listed.';
    if(missing.length){
      grid.innerHTML='<p class="rt-empty-state">Not a complete scene match yet. Missing: '+missing.join(', ')+'. Add scene-tagged audio to My Drive (Trailer BGMs, Dialogues, Sound Effects), then refresh this panel.</p>';
      status.textContent='Not ready · '+missing.join(' + ')+' missing. This scene is not counted as matched.';
      return;
    }
    grid.innerHTML=types.map(type=>'<section class="rt-resource-group"><h4>'+type+'</h4><div class="rt-audio-grid">'+grouped[type].map(asset=>{
      const url='/api/my-drive/assets/'+encodeURIComponent(asset.id)+'/preview';
      const downloadUrl='/api/my-drive/assets/'+encodeURIComponent(asset.id)+'/download';
      return '<article class="rt-audio-card"><strong>'+escapeHtml(asset.name||'Audio asset')+'</strong><div class="rt-audio-meta">My Drive · '+escapeHtml(asset.licenseStatus||'usage rights unverified')+'</div><audio controls preload="none" src="'+url+'" style="width:100%"></audio><a class="rt-download-link" href="'+downloadUrl+'" download="'+escapeHtml(asset.name||'audio')+'">Download</a></article>';
    }).join('')+'</div></section>').join('');
    grid.querySelectorAll('audio').forEach(audio=>audio.addEventListener('play',()=>grid.querySelectorAll('audio').forEach(other=>{if(other!==audio)other.pause();})));
    status.textContent='Complete match · BGM, Dialogue and SFX are all available for this scene.';

  }
  genreButtons.forEach(button=>button.addEventListener('click',()=>selectGenre(button.dataset.rtGenre)));
  sceneButtons.forEach(button=>button.addEventListener('click',()=>selectScene(button.dataset.rtScene)));
  const tab=document.querySelector('[data-resource-view="trailer"]');
  if(tab)tab.addEventListener('click',()=>{if(!panel.hidden){selectGenre(activeGenre);loadDriveAudioAssets();}});

  const baseButtons = [...panel.querySelectorAll('[data-rt-base]')];
  const baseScenes = {
    opening: ['opening-hook'],
    characters: ['hero-intro','villain-intro','heroine-intro','hanuman-sena'],
    conflict: ['hero-villain','villain-heroine'],
    emotion: ['hero-heroine','villain-heroine','emotional'],
    climax: ['hanuman-sena','action-climax','hero-villain']
  };
  const sceneTerms = {\n    'opening-hook':['opening','hook','mystery','intro','atmosphere'],
    'hero-intro':['hero','rama','entry','intro'], 'villain-intro':['villain','ravana','entry','intro'],
    'heroine-intro':['heroine','sita','entry','intro'], 'hero-villain':['faceoff','confrontation','battle','rival'],
    'hero-heroine':['romance','love','couple','relationship'], 'villain-heroine':['ashok','captivity','abduction','sita'],
    'hanuman-sena':['hanuman','sena','search','rescue','friends'], emotional:['emotional','separation','sorrow','sad'],
    'action-climax':['climax','war','fight','battle','action','rescue']
  };
  let driveAudioAssets = [];
  let activeBase = 'opening';
  function classifyAsset(asset) {
    const category = String(asset.category || '').toLowerCase();
    const text = [asset.name,asset.sourcePath,asset.subcategory,asset.tags].filter(Boolean).join(' ').toLowerCase();
    if (category.includes('trailer bgm') || /\b(bgm|score|soundtrack|music)\b/.test(text)) return 'BGM';
    if (category.includes('sound effect') || /\b(sfx|whoosh|riser|impact|boom|foley|explosion|heartbeat|sword|ambience)\b/.test(text)) return 'SFX';
    if (category.includes('dialogue') || /\b(dialogue|dialog|voiceover|voice-over|narration|speech)\b/.test(text)) return 'Dialogue';
    return '';
  }
  function sceneAssets(scene, type) {
    const terms = sceneTerms[scene] || [];
    return driveAudioAssets.filter(asset => asset.kind === 'audio' && classifyAsset(asset) === type &&
      terms.some(term => [asset.name,asset.sourcePath,asset.subcategory,asset.tags].filter(Boolean).join(' ').toLowerCase().includes(term)));
  }
  async function loadDriveAudioAssets() {
    try {
      const session = await fetch('/api/admin/session',{credentials:'same-origin',cache:'no-store'});
      if (!session.ok || !(await session.json()).authenticated) return;
      const response = await fetch('/api/my-drive/assets?limit=100',{credentials:'same-origin',cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      driveAudioAssets = Array.isArray(data.assets) ? data.assets : [];
      updateSceneAvailability();
    } catch (_) { /* My Drive may be signed out or unavailable; never invent resources. */ }
  }
  function updateSceneAvailability() {
    sceneButtons.forEach(button => {
      const id = button.dataset.rtScene;
      const complete = ['BGM','Dialogue','SFX'].every(type => sceneAssets(id,type).length > 0);
      button.dataset.rtAvailability = complete ? 'complete' : 'incomplete';
      const note = button.querySelector('small[data-rt-availability]');
      if (note) note.remove();
      const statusNote = document.createElement('small');
      statusNote.dataset.rtAvailability = 'true';
      statusNote.textContent = complete ? '✓ BGM + Dialogue + SFX ready' : 'Audio match incomplete';
      button.appendChild(statusNote);
    });
  }
  function selectBase(id) {
    if (!Object.prototype.hasOwnProperty.call(baseScenes,id)) return;
    activeBase=id;
    baseButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtBase===id));
    const allowed = baseScenes[id];
    sceneButtons.forEach(button=>{
      const show = allowed.length===0 || allowed.includes(button.dataset.rtScene);
      button.hidden = !show;
    });
    const baseNames={opening:'Opening / Hook',characters:'Character Introductions',conflict:'Conflict / Confrontation',emotion:'Emotion / Relationship',climax:'Action / Climax / Payoff'};
    title.textContent=baseNames[id]+' · Scene Matches';
    description.textContent='A complete match requires scene-relevant BGM, Dialogue and SFX. Incomplete scenes are not presented as ready.';
    status.textContent='Choose a scene. Availability is checked against audio actually saved in your authenticated My Drive.';
    loadDriveAudioAssets();
    stopCurrent();
  }
  baseButtons.forEach(button=>button.addEventListener('click',()=>selectBase(button.dataset.rtBase)));

  selectGenre(activeGenre);
  selectBase(activeBase);
  loadDriveAudioAssets();
})();