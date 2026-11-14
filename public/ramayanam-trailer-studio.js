(() => {
'use strict';
const root=document.getElementById('ramayanamStudio'); if(!root||root.dataset.tsReady)return; root.dataset.tsReady='1';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wiki='https://en.wikipedia.org/w/api.php';
const cues=[
 {id:'intro',name:'Hero / character introduction',terms:['introduc','origin','becomes','powers','identity','arrival','entry'],audio:'hero introduction cinematic'},
 {id:'power',name:'Powers / transformation',terms:['power','ability','transform','experiment','mutation','technology','suit'],audio:'transformation magical power'},
 {id:'comedy',name:'Comedy / lighter moments',terms:['comedy','humour','joke','funny','comic','prank','school'],audio:'comedy voice funny'},
 {id:'villain',name:'Villain introduction',terms:['villain','antagonist','enemy','threat','criminal','conspiracy'],audio:'dark villain suspense'},
 {id:'emotion',name:'Emotional reveal / relationship',terms:['family','love','friend','loss','death','secret','relationship'],audio:'emotional cinematic piano'},
 {id:'chase',name:'Chase / pursuit',terms:['chase','pursuit','escape','rescue','run','追'],audio:'footsteps chase running'},
 {id:'faceoff',name:'Hero–villain face-off',terms:['fight','battle','confront','versus','defeat','attack'],audio:'cinematic fight impact'},
 {id:'climax',name:'Action climax / payoff',terms:['final','climax','battle','destroy','save','defeat','showdown'],audio:'epic action trailer'}
];
let selectedScene=null,selectedFilm=null,audioType='BGM',sourceSceneCues=[],storyAudioReference=null;
async function searchWiki(query,limit=7){
 const u=new URL(wiki);u.search=new URLSearchParams({action:'query',list:'search',srsearch:query,srlimit:String(limit),format:'json',origin:'*'}).toString();
 const r=await fetch(u);if(!r.ok)throw new Error('Film information search failed ('+r.status+').');const j=await r.json();return (j.query?.search||[]).map(x=>({title:x.title,pageid:x.pageid,snippet:x.snippet||''}));
}
async function getExtract(pageid){
 const u=new URL(wiki);u.search=new URLSearchParams({action:'query',pageids:String(pageid),prop:'extracts',exintro:'1',explaintext:'1',format:'json',origin:'*'}).toString();
 const r=await fetch(u);if(!r.ok)throw new Error('Could not read the article summary.');const j=await r.json();const p=j.query?.pages?.[pageid];return p?.extract||'';
}
function detectCues(text){const low=text.toLowerCase();return cues.map(c=>({...c,score:c.terms.reduce((n,t)=>n+(low.includes(t)?1:0),0)})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,6);}
function cardHtml(film,extract,kind){
 const cueList=detectCues(extract);const shared=kind==='cross'?cueList.filter(c=>sourceSceneCues.some(s=>s.id===c.id)):cueList;
 const note=kind==='cross'?shared.length+' shared story-beat cue(s) with the source film · plot-text overlap only':(cueList.length?cueList.length+' potential story-beat cue(s) found · text match only':'No clear scene cues in the short article summary');
 return '<article class="ts-result-card"><h4>'+esc(film.title)+'</h4><p>'+esc(extract.slice(0,390)||film.snippet.replace(/<[^>]*>/g,''))+'</p><div class="ts-match-note">'+note+'</div><a href="https://en.wikipedia.org/?curid='+film.pageid+'" target="_blank" rel="noopener noreferrer">Open source article ↗</a><br><button type="button" data-ts-select="'+film.pageid+'" data-ts-title="'+esc(film.title)+'" data-ts-kind="'+kind+'">Compare scene beats</button></article>';
}
async function enrichFilms(items){return Promise.all(items.map(async f=>({film:f,extract:await getExtract(f.pageid).catch(()=>f.snippet.replace(/<[^>]*>/g,''))})));}
function sceneMarkup(list,kind){const te={intro:'హీరో / పాత్ర పరిచయం',power:'శక్తి / రూపాంతరం',comedy:'హాస్య సన్నివేశం',villain:'విలన్ పరిచయం',emotion:'భావోద్వేగం / సంబంధం',chase:'వేట / ఛేజ్',faceoff:'హీరో–విలన్ ఎదురెదురు',climax:'క్లైమాక్స్ / తుది పోరాటం'};return list.map(c=>{const label=kind==='story'?(te[c.id]||c.name||c.label):c.name;const detail=kind==='story'?'కథా సారాంశంలోని పదాల ఆధారంగా ఈ సన్నివేశం సూచించబడింది. అసలు సినిమాలో చూసి సరిపోతుందో నిర్ధారించండి.':'Matched by plot-text cues only. Verify the actual scene in the source film.';return '<article class="ts-scene-card"><div><strong>'+esc(label)+'</strong><p>'+esc(detail)+'</p></div><button type="button" data-ts-scene="'+c.id+'" data-ts-kind="'+kind+'">సంబంధిత Audio వెతుకు</button></article>';}).join('');}
function chooseFilm(film,extract,kind){
 selectedFilm={...film,extract,kind};const found=detectCues(extract);const shared=kind==='cross'?found.filter(c=>sourceSceneCues.some(s=>s.id===c.id)):found;const list=kind==='cross'?(shared.length?shared:found):found.length?found:cues.slice(0,4);
 if(kind==='story'){$('tsStorySelectedTitle').textContent=film.title;$('tsStorySceneList').innerHTML=sceneMarkup(list,kind);$('tsStoryScenes').hidden=false;}
 else{$('tsCrossSelectedTitle').textContent=film.title+' · scene cues';$('tsCrossSceneList').innerHTML=sceneMarkup(list,kind);$('tsCrossScenes').hidden=false;}
 bindSceneButtons();
}
function bindSceneButtons(){root.querySelectorAll('[data-ts-scene]').forEach(b=>b.onclick=()=>{const c=cues.find(x=>x.id===b.dataset.tsScene)||sourceSceneCues.find(x=>x.id===b.dataset.tsScene);selectedScene=c;const source=selectedFilm?.kind==='story'?storyAudioReference:null;const query=[c?.audio||'cinematic sound',audioType.toLowerCase()].filter(Boolean).join(' ');$('tsAudioHeading').textContent=(c?.name||'Scene')+' · '+audioType;$('tsAudioQuery').value=query;$('tsAudioSubheading').textContent=source?'Story reference: '+source.movie+' → '+(source.reference||'matching story beats')+' · '+(selectedScene?.name||'selected story beat')+'. Public CC0 / CC-BY audio మాత్రమే preview/download అవుతుంది; copyrighted movie dialogue/BGM‌ను extract చేయము.':'Search only eligible CC0 / CC-BY public audio. Verify the licence before use.';$('tsAudioArea').scrollIntoView({behavior:'smooth',block:'start'});searchAudio(query);});}
async function runStorySearch(e){
 e.preventDefault();const query=$('tsStoryQuery').value.trim();if(!query)return;
 $('tsStoryStatus').textContent='సినిమా కథను విశ్లేషించి, వేరే హీరోల Telugu సినిమాల్లో దగ్గరైన కథలను వెతుకుతున్నాం…';$('tsStoryResults').innerHTML='';$('tsStoryScenes').hidden=true;storyAudioReference={movie:query};sourceSceneCues=[];
 try{
  const r=await fetch('/api/trailer/discover?mode=story&movie='+encodeURIComponent(query),{credentials:'same-origin',cache:'no-store'}),data=await r.json();
  if(!r.ok)throw Error(data.error||'Storyline search ప్రస్తుతం అందుబాటులో లేదు.');
  sourceSceneCues=(data.sourceBeats||[]).map(x=>({id:x.id,name:x.label,audio:x.label+' scene cinematic'}));
  selectedFilm={title:query,kind:'story'};
  $('tsStorySelectedTitle').textContent=query+(data.visualHero?' · '+data.visualHero:'')+' → కథా పోలికలు';
  const rows=data.matches||[];
  if(!rows.length){
   const partial=data.partialEvidence||[];
   $('tsStoryResults').innerHTML='<p class="ts-empty">ఇప్పటికి బలమైన storyline match నిర్ధారించలేకపోయాం. తక్కువ పోలిక ఉన్న సినిమాను best matchగా చూపించలేదు.</p>'+(partial.length?'<h4>Partial matches · ఇంకా verify చేయాలి</h4>'+partial.map(x=>'<article class="ts-result-card"><strong>'+esc(x.title)+'</strong><p>'+esc(x.evidence||'')+'</p><p>Shared clues: '+esc((x.sharedBeats||[]).map(b=>b.label).join(', '))+'</p><a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Original source ↗</a></article>').join(''):'');
   $('tsStoryStatus').textContent='పూర్తి storyline match లేదు. Providers checked: '+(data.providersUsed||[]).join(', ')+'. '+(data.providerErrors?.length?'కొన్ని providers అందుబాటులో లేవు. ':'')+'మరొక movie title ప్రయత్నించండి.';
   return;
  }
  $('tsStoryResults').innerHTML=rows.map((x,i)=>{
   const shared=(x.sharedBeats||[]).map(b=>'<span class="ts-match-chip">'+esc(b.label)+'</span>').join(' ');
   const sources=(x.sources||[]).map(s=>'<div class="ts-source-evidence"><strong>'+esc(s.source)+' · '+esc(s.title||'Public reference')+'</strong><p>'+esc(s.evidence||'')+'</p>'+(s.videoId?'<iframe title="'+esc(s.title||'Video reference')+'" src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(s.videoId)+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>':'')+'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">Original source ↗</a></div>').join('');
   return '<article class="ts-result-card"><div class="ts-match-rank">#'+(i+1)+' · '+esc(x.matchStrength||'candidate')+' · '+esc(String(x.score))+'% plot-beat overlap</div><h4>'+esc(x.title)+'</h4><strong>Different hero: '+esc(x.hero)+'</strong><p>'+esc(x.reason)+'</p><div class="ts-match-note">Shared story elements: '+shared+'</div>'+sources+'<button type="button" data-ts-match-scenes="'+i+'">ఈ సినిమా scene cues చూడండి</button></article>';
  }).join('');
  $('tsStorySceneList').innerHTML=sceneMarkup(sourceSceneCues,'story');
  $('tsStoryScenes').hidden=false;bindSceneButtons();
  root.querySelectorAll('[data-ts-match-scenes]').forEach(b=>b.onclick=()=>{const match=rows[Number(b.dataset.tsMatchScenes)];if(!match)return;storyAudioReference={movie:query,reference:match.title,hero:match.hero};selectedFilm={title:match.title,kind:'story',extract:(match.sharedBeats||[]).map(x=>x.label).join('. ')};sourceSceneCues=(match.sharedBeats||[]).map(x=>({id:x.id,name:x.label,audio:x.label+' scene cinematic'}));$('tsStorySelectedTitle').textContent=match.title+' · '+match.hero+' · matching scene beats';$('tsStorySceneList').innerHTML=sceneMarkup(sourceSceneCues,'story');bindSceneButtons();$('tsStoryScenes').scrollIntoView({behavior:'smooth',block:'nearest'});});
  $('tsStoryStatus').textContent=query+' ('+(data.visualHero||'source hero not confirmed')+') కోసం '+rows.length+' different-hero storyline candidate(s). Public evidence: '+(data.providersUsed||[]).join(', ')+'. Plot snippets మాత్రమే; actual scenes sourceలో verify చేయాలి.';
 }catch(err){$('tsStoryStatus').textContent=err.message;}
}
function bindFilmButtons(full){root.querySelectorAll('[data-ts-select]').forEach(b=>b.onclick=()=>{const x=full.find(v=>String(v.film.pageid)===b.dataset.tsSelect);if(x)chooseFilm(x.film,x.extract,b.dataset.tsKind);});}
async function runCrossSearch(e){e.preventDefault();const movie=$('tsCrossMovie').value.trim(),target=$('tsTargetIndustry').value,genre=$('tsCrossGenre').value,language=$('tsCrossLanguage').value.trim();if(!movie)return;
 $('tsCrossStatus').textContent='Reading reference film information…';$('tsCrossResults').innerHTML='';$('tsCrossScenes').hidden=true;
 try{const src=await searchWiki(movie+' film plot',1);let sourceExtract='';if(src[0]){sourceExtract=await getExtract(src[0].pageid);sourceSceneCues=detectCues(sourceExtract);$('tsCrossSource').textContent='Reference: '+src[0].title+' · '+sourceExtract.slice(0,260)+' · '+sourceSceneCues.length+' plot cue(s) identified.';}else{sourceSceneCues=[];$('tsCrossSource').textContent='Could not locate a source-film plot summary. Results will be broad industry candidates, not scene matches.';}
 const genreTerms=[genre,language].filter(Boolean).join(' ');
 const queries=[...sourceSceneCues.slice(0,5).map(c=>target+' '+c.name+' '+(genreTerms||'film')),target+' '+(genre||'popular')+' film',target+' '+(language||'cinema')+' movie'];
 const results=[];for(const q of queries){for(const f of await searchWiki(q,5)){if(!results.some(x=>x.pageid===f.pageid))results.push(f);if(results.length>=12)break;}if(results.length>=12)break;}
 const full=await enrichFilms(results);if(!full.length)throw new Error('No cross-industry reference articles found. Try another target industry or genre.');
 $('tsCrossResults').innerHTML=full.map(x=>cardHtml(x.film,x.extract,'cross')).join('');$('tsCrossStatus').textContent=full.length+' possible '+target+' reference article(s). These are discovery candidates, not verified scene equivalents.';bindFilmButtons(full);
 }catch(err){$('tsCrossStatus').textContent=err.message;}}
async function searchAudio(query){$('tsAudioStatus').textContent='Searching eligible public audio…';$('tsAudioResults').innerHTML='';try{
 const q=(query||'').trim();if(!q)throw new Error('Enter an audio search phrase.');const params=new URLSearchParams({query:q,page:'1'});const r=await fetch('/api/resources/sounds?'+params.toString(),{credentials:'same-origin',cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Audio provider unavailable.');const items=Array.isArray(data.results)?data.results:[];
 if(!items.length){$('tsAudioStatus').textContent='No eligible audio assets found for this phrase. Try a broader cue, or use your own authorised audio from My Drive.';return;}
 $('tsAudioStatus').textContent=items.length+' eligible result(s) · provider-filtered CC0 / CC-BY. Preview and download availability is checked per item.';
 $('tsAudioResults').innerHTML=items.map(a=>'<article class="ts-audio-card"><strong>'+esc(a.title||'Untitled audio')+'</strong><div class="ts-meta">'+esc(a.creator||'Unknown creator')+' · '+esc(a.duration||'Duration not supplied')+'<br>'+esc(a.license||'Licence not supplied')+'</div>'+(a.previewUrl?'<audio controls preload="none" src="/api/resources/sounds/'+encodeURIComponent(a.id)+'/preview"></audio>':'<p>Preview unavailable</p>')+'<div class="ts-audio-actions">'+(a.id?'<a href="/api/resources/sounds/'+encodeURIComponent(a.id)+'/download">Download eligible audio</a>':'')+(a.url?'<a href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'')+'</div></article>').join('');
 }catch(err){$('tsAudioStatus').textContent=err.message;}}
$('tsStoryForm').addEventListener('submit',runStorySearch);$('tsCrossForm').addEventListener('submit',runCrossSearch);
$('tsStoryTab').addEventListener('click',()=>setModule('story'));$('tsCrossTab').addEventListener('click',()=>setModule('cross'));
function setModule(which){const story=which==='story';$('tsStoryTab').classList.toggle('active',story);$('tsCrossTab').classList.toggle('active',!story);$('tsStoryTab').setAttribute('aria-selected',String(story));$('tsCrossTab').setAttribute('aria-selected',String(!story));$('tsStoryModule').hidden=!story;$('tsCrossModule').hidden=story;}
root.querySelectorAll('[data-ts-audio]').forEach(b=>b.addEventListener('click',()=>{audioType=b.dataset.tsAudio;root.querySelectorAll('[data-ts-audio]').forEach(x=>x.classList.toggle('active',x===b));const q=[selectedScene?.audio||'cinematic sound',audioType.toLowerCase()].filter(Boolean).join(' ');$('tsAudioQuery').value=q;searchAudio(q);}));
$('tsAudioSearchBtn').addEventListener('click',()=>searchAudio($('tsAudioQuery').value));
$('tsAudioQuery').addEventListener('keydown',e=>{if(e.key==='Enter')searchAudio($('tsAudioQuery').value);});
$('tsStoryOpenAudio').addEventListener('click',()=>{$('tsAudioArea').scrollIntoView({behavior:'smooth'});$('tsAudioQuery').value=[selectedScene?.audio||'cinematic music',audioType.toLowerCase()].filter(Boolean).join(' ');$('tsAudioSubheading').textContent=storyAudioReference?'Story reference: '+storyAudioReference.movie+' → '+(selectedScene?.ramayanaEvent||selectedScene?.name||'selected story beat')+'. Exact commercial-film audio is not extracted; only eligible public assets are listed.':'Choose a story beat first.';searchAudio($('tsAudioQuery').value);});
$('tsBuildConcept').addEventListener('click',()=>{const notes=$('tsNewStoryNotes').value.trim();const beat=selectedScene?.name||'selected story beat';const ref=selectedFilm?.title||$('tsCrossMovie').value.trim();$('tsConceptOutput').textContent='NEW SCENE CONCEPT\nReference inspiration: '+ref+'\nStory beat: '+beat+'\nNew direction: '+(notes||'Add your own characters, setting, conflict and dialogue direction.')+'\n\nUse the reference for structural inspiration only. Create original characters, dialogue, visuals and music, and verify rights for every asset.';});
})();
