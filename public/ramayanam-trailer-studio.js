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
function sceneMarkup(list,kind){const te={intro:'హీరో / పాత్ర పరిచయం',power:'శక్తి / రూపాంతరం',comedy:'హాస్య సన్నివేశం',villain:'విలన్ పరిచయం',emotion:'భావోద్వేగం / సంబంధం',chase:'వేట / ఛేజ్',faceoff:'హీరో–విలన్ ఎదురెదురు',climax:'క్లైమాక్స్ / తుది పోరాటం'};return list.map(c=>{const label=kind==='story'?(te[c.id]||c.name):c.name;const detail=kind==='story'?'కథా సారాంశంలోని పదాల ఆధారంగా ఈ సన్నివేశం సూచించబడింది. అసలు సినిమాలో చూసి సరిపోతుందో నిర్ధారించండి.':'Matched by plot-text cues only. Verify the actual scene in the source film.';return '<article class="ts-scene-card"><div><strong>'+esc(label)+'</strong><p>'+esc(detail)+'</p></div><button type="button" data-ts-scene="'+c.id+'" data-ts-kind="'+kind+'">సంబంధిత Audio వెతుకు</button></article>';}).join('');}
function chooseFilm(film,extract,kind){
 selectedFilm={...film,extract,kind};const found=detectCues(extract);const shared=kind==='cross'?found.filter(c=>sourceSceneCues.some(s=>s.id===c.id)):found;const list=kind==='cross'?(shared.length?shared:found):found.length?found:cues.slice(0,4);
 if(kind==='story'){$('tsStorySelectedTitle').textContent=film.title;$('tsStorySceneList').innerHTML=sceneMarkup(list,kind);$('tsStoryScenes').hidden=false;}
 else{$('tsCrossSelectedTitle').textContent=film.title+' · scene cues';$('tsCrossSceneList').innerHTML=sceneMarkup(list,kind);$('tsCrossScenes').hidden=false;}
 bindSceneButtons();
}
function bindSceneButtons(){root.querySelectorAll('[data-ts-scene]').forEach(b=>b.onclick=()=>{const c=cues.find(x=>x.id===b.dataset.tsScene);selectedScene=c;const source=selectedFilm?.kind==='story'?storyAudioReference:null;const query=[c?.audio||'cinematic sound',audioType.toLowerCase(),source?.hero,source?.movie].filter(Boolean).join(' ');$('tsAudioHeading').textContent=(c?.name||'Scene')+' · '+audioType;$('tsAudioQuery').value=query;$('tsAudioSubheading').textContent=source?'Audio reference: '+source.hero+' — '+source.movie+'. ఖచ్చితమైన సినిమా dialogue/BGM హక్కులతో అందుబాటులో లేకపోతే ఇక్కడ చూపించబడదు. Public search‌లో లభించే CC0 / CC-BY audio మాత్రమే preview/download అవుతుంది; మీకు అనుమతి ఉన్న అసలు audio కోసం My Drive ఉపయోగించండి.':'Search only eligible CC0 / CC-BY public audio. Verify the licence before use.';$('tsAudioArea').scrollIntoView({behavior:'smooth',block:'start'});searchAudio(query);});}
async function runStorySearch(e){
 e.preventDefault();const query=$('tsStoryQuery').value.trim();if(!query)return;
 $('tsStoryStatus').textContent='మీ Visual Reference సినిమా కథా వివరాలు చదివి, దానికి సరిపోయే వేరే Tollywood హీరో Audio Reference వెతుకుతున్నాం…';
 $('tsStoryResults').innerHTML='';$('tsStoryScenes').hidden=true;storyAudioReference=null;sourceSceneCues=[];
 try{
  const heroes=['Prabhas','N. T. Rama Rao Jr.','Jr NTR','Ram Charan','Allu Arjun','Mahesh Babu','Pawan Kalyan','Chiranjeevi','Venkatesh','Nagarjuna','Nani','Ravi Teja','Vijay Deverakonda','Balakrishna','Sharwanand','Gopichand','Varun Tej','Sai Dharam Tej','Adivi Sesh'];
  const identifyHero=extract=>heroes.find(h=>extract.toLowerCase().includes(h.toLowerCase()))||null;
  const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  const visualHits=await searchWiki(query+' Telugu film',20),visualFull=await enrichFilms(visualHits);
  const visual=visualFull.find(x=>norm(x.film.title)===norm(query))||visualFull.find(x=>norm(x.film.title).includes(norm(query))||norm(query).includes(norm(x.film.title)));
  if(!visual)throw new Error('మీరు ఇచ్చిన Visual Reference సినిమా పేరు Wikipedia Telugu-film searchలో నిర్ధారించలేకపోయాం. సరైన సినిమా పేరు ఇవ్వండి.');
  if(!/telugu|tollywood/i.test(visual.film.title+' '+visual.extract.slice(0,1800)))throw new Error('ఈ result Telugu/Tollywood సినిమా అని article ఆధారంగా నిర్ధారణ కాలేదు. తప్పు Visual Reference చూపించలేదు.');
  const visualHero=identifyHero(visual.extract);
  if(!visualHero)throw new Error('Visual Reference సినిమా దొరికింది ('+visual.film.title+'), కానీ అందులోని హీరోను article ఆధారంగా నిర్ధారించలేకపోయాం. వేరే హీరో Audio match‌ను ఊహించి చూపించలేదు.');
  const visualCues=detectCues(visual.extract);
  if(!visualCues.length)throw new Error('Visual Reference కథా సారాంశంలో సరిపోల్చడానికి scene-beat సమాచారం లేదు. ఈ సినిమా కోసం Audio match‌ను verify చేయలేకపోయాం.');
  sourceSceneCues=visualCues;
  const candidateMap=new Map();
  for(const cue of visualCues.slice(0,5)){
   const hits=await searchWiki('Telugu film '+cue.name+' '+cue.audio+' cast',10);
   for(const film of hits){if(film.pageid!==visual.film.pageid&&!candidateMap.has(film.pageid))candidateMap.set(film.pageid,film);}
  }
  const audioFull=await enrichFilms([...candidateMap.values()]);
  const candidates=audioFull.map(x=>{const hero=identifyHero(x.extract);const beats=detectCues(x.extract);const shared=beats.filter(c=>visualCues.some(v=>v.id===c.id));return {...x,hero,shared,score:shared.reduce((n,c)=>n+c.score,0)};})
   .filter(x=>x.hero&&norm(x.hero)!==norm(visualHero)&&/telugu|tollywood/i.test(x.film.title+' '+x.extract.slice(0,1800))&&x.shared.length)
   .sort((a,b)=>b.shared.length-a.shared.length||b.score-a.score);
  const audio=candidates[0];
  if(!audio)throw new Error('Visual Reference ('+visual.film.title+') దొరికింది. కానీ వేరే హీరో సినిమా నుంచి సరిపోయే scene-beat overlap ఉన్న Audio Reference‌ను verify చేయలేకపోయాం. తప్పు match చూపించకుండా ఆపేశాం.');
  const audioHero=audio.hero,matchedBeats=audio.shared.map(c=>c.name);
  selectedFilm={...visual.film,extract:visual.extract,kind:'story'};
  storyAudioReference={hero:audioHero,movie:audio.film.title,film:audio.film,extract:audio.extract,url:'https://en.wikipedia.org/?curid='+audio.film.pageid,matchedBeats};
  $('tsStoryResults').innerHTML='<article class="ts-result-card"><h4>YOUR VISUAL REFERENCE · '+esc(visualHero)+'</h4><strong>'+esc(visual.film.title)+'</strong><p>'+esc(visual.extract.slice(0,340))+'</p><a href="https://en.wikipedia.org/?curid='+visual.film.pageid+'" target="_blank" rel="noopener noreferrer">Visual movie source ↗</a></article><article class="ts-result-card"><h4>SUGGESTED AUDIO REFERENCE · '+esc(audioHero)+'</h4><strong>'+esc(audio.film.title)+'</strong><p>'+esc(audio.extract.slice(0,340))+'</p><div class="ts-match-note">సారాంశంలో కనిపించిన common story beats: '+esc(matchedBeats.join(', '))+'. ఇది plot-summary ఆధారిత candidate మాత్రమే; actual scene/audio match ఇంకా verify చేయాలి.</div><a href="'+storyAudioReference.url+'" target="_blank" rel="noopener noreferrer">Audio movie source ↗</a></article>';
  $('tsStorySelectedTitle').textContent='Visual: '+visualHero+' — '+visual.film.title;
  $('tsStorySceneList').innerHTML=sceneMarkup(visualCues,'story');$('tsStoryScenes').hidden=false;
  $('tsStoryStatus').textContent='మీరు ఇచ్చిన Visual movie '+visual.film.title+'. దానికి scene-beat overlap ఉన్న వేరే హీరో '+audioHero+' సినిమా '+audio.film.title+'ని Audio Reference candidate‌గా సూచించాం. ఇది article plot text ఆధారితం; actual scene, dialogue, BGM సరిపోతాయో తప్పనిసరిగా verify చేయాలి.';
  bindSceneButtons();
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
root.querySelectorAll('[data-ts-audio]').forEach(b=>b.addEventListener('click',()=>{audioType=b.dataset.tsAudio;root.querySelectorAll('[data-ts-audio]').forEach(x=>x.classList.toggle('active',x===b));const q=[selectedScene?.audio||'cinematic sound',audioType.toLowerCase(),selectedFilm?.kind==='story'?storyAudioReference?.hero:'',selectedFilm?.kind==='story'?storyAudioReference?.movie:''].filter(Boolean).join(' ');$('tsAudioQuery').value=q;searchAudio(q);}));
$('tsAudioSearchBtn').addEventListener('click',()=>searchAudio($('tsAudioQuery').value));
$('tsAudioQuery').addEventListener('keydown',e=>{if(e.key==='Enter')searchAudio($('tsAudioQuery').value);});
$('tsStoryOpenAudio').addEventListener('click',()=>{$('tsAudioArea').scrollIntoView({behavior:'smooth'});$('tsAudioQuery').value=[selectedScene?.audio||'cinematic music',audioType.toLowerCase(),storyAudioReference?.hero,storyAudioReference?.movie].filter(Boolean).join(' ');$('tsAudioSubheading').textContent=storyAudioReference?'Audio reference: '+storyAudioReference.hero+' — '+storyAudioReference.movie+'. Exact commercial-film audio is not extracted; only eligible public assets are listed.':'Choose a separate Tollywood audio hero first.';searchAudio($('tsAudioQuery').value);});
$('tsBuildConcept').addEventListener('click',()=>{const notes=$('tsNewStoryNotes').value.trim();const beat=selectedScene?.name||'selected story beat';const ref=selectedFilm?.title||$('tsCrossMovie').value.trim();$('tsConceptOutput').textContent='NEW SCENE CONCEPT\nReference inspiration: '+ref+'\nStory beat: '+beat+'\nNew direction: '+(notes||'Add your own characters, setting, conflict and dialogue direction.')+'\n\nUse the reference for structural inspiration only. Create original characters, dialogue, visuals and music, and verify rights for every asset.';});
})();
