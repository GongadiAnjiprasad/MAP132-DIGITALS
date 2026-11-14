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
      'hero-intro':'Hero Intro','villain-intro':'Villain Intro','heroine-intro':'Heroine Intro',
      'hero-villain':'Hero vs Villain','hero-heroine':'Hero vs Heroine','villain-heroine':'Ashokavanam',
      'hanuman-sena':'Hanuman Sena',emotional:'Separation','action-climax':'Action / Climax'
    };
    genreButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtGenre===related[0]));
    sceneButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtScene===id));
    const keys=related.flatMap(key=>library[key].items);
    render(keys,names[id]+' · Scene Audio','Scene-matched tracks. Preview first, then download the same track.');
  }
  genreButtons.forEach(button=>button.addEventListener('click',()=>selectGenre(button.dataset.rtGenre)));
  sceneButtons.forEach(button=>button.addEventListener('click',()=>selectScene(button.dataset.rtScene)));
  const tab=document.querySelector('[data-resource-view="trailer"]');
  if(tab)tab.addEventListener('click',()=>{if(!panel.hidden)selectGenre(activeGenre);});
  selectGenre(activeGenre);
})();