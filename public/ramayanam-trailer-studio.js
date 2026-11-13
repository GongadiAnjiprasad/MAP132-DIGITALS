(()=> {
 const $=id=>document.getElementById(id);
 const panel=$('ramayanamStudio');
 if(!panel)return;
 const cueData=[
  {time:'00:00–00:09',scene:'Rama & Seetha meet',bgm:'Divine flute + soft strings',sfx:'Rain ambience, temple bell',line:'యదా యదా హి ధర్మస్య గ్లానిర్భవతి భారత…',note:'Opening connection; keep the music gentle.'},
  {time:'00:09–00:19',scene:'Ravana enters',bgm:'Dark orchestral braam',sfx:'Low boom, metal impact',line:'ఒక వైపు ప్రేమకు ప్రతిరూపం… మరోవైపు అహంకారానికి ప్రతిరూపం.',note:'Build from silence into a powerful villain reveal.'},
  {time:'00:19–00:31',scene:'Ashokavanam',bgm:'Dark drone + restrained strings',sfx:'Door close, wind, low heartbeat',line:'సీతను లంకకు తీసుకెళ్లగలిగాడు… కానీ ఆమె మనసును గెలవలేకపోయాడు.',note:'Keep the scene tense; do not overuse impacts.'},
  {time:'00:31–00:41',scene:'Ravana pressures Seetha',bgm:'Low strings + ominous pulse',sfx:'Stage ambience, single impact',line:'నిన్ను నా సొంతం చేసుకోవాలనుకున్నాను… నా మాట వినకపోతే ఈ లంక దాటి వెళ్లలేవు.',note:'Match the Ramayanam stage-play and the real scene.'},
  {time:'00:41–00:51',scene:'Rama–Seetha separation',bgm:'Emotional violin + piano',sfx:'Rain, soft reverse swell',line:'అపార్థం అనే అగ్ని… ప్రేమతో కలిసిన రెండు హృదయాలను దూరం చేసింది.',note:'Let the expressions breathe; leave a short silence.'},
  {time:'00:51–01:01',scene:'Hanuman searches',bgm:'Rising percussion + hopeful strings',sfx:'Footsteps, quick whoosh',line:'సీత జాడ తెలిసింది… ఇక రాముడి ప్రయాణం లంక వైపు.',note:'Increase tempo and energy toward the reveal.'},
  {time:'01:01–01:15',scene:'Rama meets Seetha',bgm:'Sparse emotional strings',sfx:'Heartbeat, room tone',line:'నువ్వు వస్తావని ఎదురుచూశాను…',note:'Keep dialogue clear; duck the music under the voice.'},
  {time:'01:15–01:25',scene:'Rama vs Ravana',bgm:'Epic war drums + brass',sfx:'Battle whooshes, impacts, metallic hits',line:'ఇది కేవలం ఒక ప్రేమ కథ కాదు… ధర్మానికి, అహంకారానికి మధ్య జరిగే పోరాటం!',note:'Cut impacts to picture; avoid stacking every hit.'},
  {time:'01:25–01:30',scene:'Final reveal',bgm:'Orchestral resolve + conch',sfx:'Conch blast, final bass hit',line:'పరిత్రాణాయ సాధూనాం వినాశాయ చ దుష్కృతామ్…',note:'Drop to black before the title impact.'}
 ];
 const dialogues=[
  {label:'Opening shloka · Gita 4.7',text:'యదా యదా హి ధర్మస్య గ్లానిర్భవతి భారత…',kind:'శ్లోకం'},
  {label:'Ravana introduction',text:'ఒక వైపు ప్రేమకు ప్రతిరూపం… మరోవైపు అహంకారానికి ప్రతిరూపం.',kind:'నేరేషన్'},
  {label:'Ashokavanam',text:'సీతను లంకకు తీసుకెళ్లగలిగాడు… కానీ ఆమె మనసును గెలవలేకపోయాడు.',kind:'నేరేషన్'},
  {label:'Ravana marriage pressure',text:'నిన్ను నా సొంతం చేసుకోవాలనుకున్నాను… నా మాట వినకపోతే ఈ లంక దాటి వెళ్లలేవు.',kind:'విలన్ వాయిస్'},
  {label:'Separation',text:'అపార్థం అనే అగ్ని… ప్రేమతో కలిసిన రెండు హృదయాలను దూరం చేసింది.',kind:'నేరేషన్'},
  {label:'Hanuman search',text:'సీత జాడ తెలిసింది… ఇక రాముడి ప్రయాణం లంక వైపు.',kind:'నేరేషన్'},
  {label:'Rama–Seetha reunion',text:'నువ్వు వస్తావని ఎదురుచూశాను…',kind:'సీత డైలాగ్'},
  {label:'Final confrontation',text:'ఇది కేవలం ఒక ప్రేమ కథ కాదు… ధర్మానికి, అహంకారానికి మధ్య జరిగే పోరాటం!',kind:'నేరేషన్'},
  {label:'Closing shloka · Gita 4.8',text:'పరిత్రాణాయ సాధూనాం వినాశాయ చ దుష్కృతామ్…',kind:'శ్లోకం'}
 ];
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cueBox=$('ramayanamCues'),dialogueBox=$('ramayanamDialogues');
 cueBox.innerHTML=cueData.map((x,i)=>'<article class="rt-cue"><div class="rt-cue-time">'+x.time+'</div><div class="rt-cue-main"><div class="rt-cue-title">'+(i+1).toString().padStart(2,'0')+' · '+safe(x.scene)+'</div><div class="rt-cue-grid"><span><b>BGM</b>'+safe(x.bgm)+'</span><span><b>SFX</b>'+safe(x.sfx)+'</span></div><p class="rt-cue-line">'+safe(x.line)+'</p><small>'+safe(x.note)+'</small></div><button type="button" class="rt-search-sfx" data-sfx="'+safe(x.sfx)+'">Find SFX</button></article>').join('');
 dialogueBox.innerHTML=dialogues.map((x,i)=>'<article class="rt-dialogue"><div><span>'+safe(x.kind)+'</span><strong>'+safe(x.label)+'</strong><p>'+safe(x.text)+'</p></div><button type="button" data-copy-dialogue="'+i+'" aria-label="Copy dialogue">Copy</button></article>').join('');
 dialogueBox.addEventListener('click',async e=>{const b=e.target.closest('[data-copy-dialogue]');if(!b)return;const item=dialogues[Number(b.dataset.copyDialogue)];try{await navigator.clipboard.writeText(item.text);b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1300)}catch{const area=document.createElement('textarea');area.value=item.text;panel.appendChild(area);area.select();document.execCommand('copy');area.remove();b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1300)}});
 cueBox.addEventListener('click',e=>{const b=e.target.closest('[data-sfx]');if(!b)return;const q=b.dataset.sfx+' cinematic sound effect';const input=$('rtSfxQuery');input.value=q;searchSfx(q);});
 const sfxForm=$('rtSfxForm'),sfxResults=$('rtSfxResults'),sfxStatus=$('rtSfxStatus');
 async function searchSfx(query){sfxStatus.textContent='Searching eligible CC0 / CC-BY sounds…';sfxResults.innerHTML='';try{const r=await fetch('/api/resources/sounds?query='+encodeURIComponent(query)+'&page=1&refresh='+Date.now(),{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Sound search unavailable');const items=Array.isArray(data.results)?data.results:[];if(!items.length){sfxStatus.textContent='No eligible sounds found. Try a shorter search.';return}sfxStatus.textContent=items.length+' eligible sounds found. Check each licence and attribution before use.';sfxResults.innerHTML=items.slice(0,8).map(x=>'<article class="rt-audio-card"><strong>'+safe(x.title)+'</strong><small>'+safe(x.creator||'Unknown creator')+' · '+safe(x.license||'Licence details unavailable')+'</small><audio controls preload="none" src="/api/resources/sounds/'+encodeURIComponent(x.id)+'/preview"></audio><a href="/api/resources/sounds/'+encodeURIComponent(x.id)+'/download" download>Download</a></article>').join('');sfxResults.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>sfxResults.querySelectorAll('audio').forEach(other=>{if(other!==a)other.pause()})))}catch(err){sfxStatus.textContent=err.message||'Could not load sound effects.'}}
 sfxForm.addEventListener('submit',e=>{e.preventDefault();const q=$('rtSfxQuery').value.trim();if(q)searchSfx(q)});
 const driveStatus=$('rtDriveStatus'),driveAssets=$('rtDriveAssets'),driveRefresh=$('rtDriveRefresh');
 async function loadDriveAudio(){driveStatus.textContent='Checking your saved MAP132 Drive audio…';driveAssets.innerHTML='';try{const r=await fetch('/api/my-drive/assets?limit=100',{credentials:'same-origin',cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Login to My Drive first, then refresh this list.');const assets=(data.assets||[]).filter(x=>x.kind==='audio');if(!assets.length){driveStatus.textContent='No saved audio assets found yet. Import your BGM / dialogue recordings / SFX through the My Drive tab.';return}driveStatus.textContent=assets.length+' saved audio asset(s) · from your private MAP132 Workspace library.';driveAssets.innerHTML=assets.map(x=>'<article class="rt-audio-card"><strong>'+safe(x.name)+'</strong><small>'+safe(x.category||'Audio')+' · '+safe(x.subcategory||'')+' · '+safe(x.licenseStatus||'licence unverified')+'</small><audio controls preload="none" src="/api/my-drive/assets/'+encodeURIComponent(x.id)+'/preview"></audio><a href="/api/my-drive/assets/'+encodeURIComponent(x.id)+'/download" download="'+safe(x.name)+'">Download</a></article>').join('');driveAssets.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>{document.querySelectorAll('audio').forEach(other=>{if(other!==a)other.pause()})}))}catch(err){driveStatus.textContent=err.message||'Could not load saved Drive audio. Open My Drive and sign in, then refresh.'}}
 driveRefresh.addEventListener('click',loadDriveAudio);
 const tabs=[...panel.querySelectorAll('[data-rt-tab]')],views=[...panel.querySelectorAll('[data-rt-view]')];
 function showTab(name){tabs.forEach(b=>{const active=b.dataset.rtTab===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});views.forEach(v=>v.hidden=v.dataset.rtView!==name)}
 panel.querySelector('.rt-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-rt-tab]');if(b)showTab(b.dataset.rtTab)});
 panel.querySelector('[data-rt-open-my-drive]').addEventListener('click',()=>{const b=document.querySelector('[data-resource-view="my-drive"]');if(b)b.click();window.scrollTo({top:document.getElementById('myDrivePanel').offsetTop-20,behavior:'smooth'})});
 showTab('timeline');
})();

/* Ramayanam Audio Library: load once from the user's already-imported Drive assets. */
(()=> {
 const panel=document.getElementById('ramayanamStudio');
 const grid=document.getElementById('rtLibraryAssets');
 if(!panel||!grid)return;
 const status=document.getElementById('rtLibraryStatus');
 const refresh=document.getElementById('rtLibraryRefresh');
 const cats=[...panel.querySelectorAll('[data-library-cat]')];
 let assets=[],active='all',loaded=false;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const classify=x=>{
  const value=[x.category,x.subcategory,x.name,x.filename,x.sourcePath].filter(Boolean).join(' ').toLowerCase();
  if(/shloka|chant|mantra|stotra|sloka/.test(value))return 'shloka';
  if(/dialogue|voice|speech|narration|vocal/.test(value))return 'dialogue';
  if(/bgm|background|score|music|orchestral|theme/.test(value))return 'bgm';
  if(/sfx|sound effect|whoosh|impact|boom|conch|bell|battle/.test(value))return 'sfx';
  if(/final mix|trailer mix|master mix|final audio/.test(value))return 'mix';
  return 'other';
 };
 const label={dialogue:'Dialogues',shloka:'Shlokas & chants',bgm:'Background music',sfx:'Sound effects',mix:'Final mix',other:'Other / unclassified'};
 function render(){
  const list=assets.filter(x=>active==='all'||classify(x)===active);
  if(!list.length){grid.innerHTML='<div class="rt-library-empty">No audio in this category yet. Import your authorised MP3/WAV files once through My Drive; they will appear here automatically after refresh.</div>';return;}
  grid.innerHTML=list.map(x=>{
   const name=x.name||x.filename||'Audio asset';
   const format=(name.match(/\.([a-z0-9]{2,5})$/i)||[])[1]||x.mimeType?.split('/').pop()||'format not reported';
   return '<article class="rt-audio-card"><strong>'+safe(name)+'</strong><small>'+safe(label[classify(x)])+' · '+safe(String(format).toUpperCase())+' · '+safe(x.licenseStatus||'licence not verified')+'</small><audio controls preload="none" src="/api/my-drive/assets/'+encodeURIComponent(x.id)+'/preview"></audio><a href="/api/my-drive/assets/'+encodeURIComponent(x.id)+'/download" download="'+safe(name)+'">Download</a></article>';
  }).join('');
  grid.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(other=>{if(other!==a)other.pause()})));
 }
 async function load(force=false){
  status.textContent='Loading your saved audio library…';
  try{
   let cursor=null,all=[],pages=0;
   do{
    const url='/api/my-drive/assets?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'');
    const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||'Connect My Drive first, then refresh.');
    all=all.concat(Array.isArray(data.assets)?data.assets:[]);
    cursor=typeof data.cursor==='string'&&data.cursor?data.cursor:null;
    pages++;
   }while(cursor&&pages<100);
   const seen=new Set();
   assets=all.filter(x=>x.kind==='audio'&&x.id&&!seen.has(x.id)&&seen.add(x.id));
   loaded=true;
   status.textContent=assets.length+' saved audio file(s) · '+(cursor?'More than 100 pages; refresh again to continue.':'All available pages loaded.')+' Original Drive files unchanged.';
   render();
  }catch(e){status.textContent=e.message||'Could not load your Drive audio.';grid.innerHTML='';}
 }
 cats.forEach(b=>b.addEventListener('click',()=>{active=b.dataset.libraryCat;cats.forEach(x=>x.classList.toggle('active',x===b));if(loaded)render();}));
 if(refresh)refresh.addEventListener('click',()=>load(true));
 const libraryTab=panel.querySelector('[data-rt-tab="library"]');
 if(libraryTab)libraryTab.addEventListener('click',()=>{if(!loaded)load();});
})();
