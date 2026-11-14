(()=> {
const panel=document.getElementById('ramayanamStudio');
const grid=document.getElementById('rtLibraryAssets');
if(!panel||!grid)return;
const status=document.getElementById('rtLibraryStatus');
const title=document.getElementById('rtDownloadTitle');
const description=document.getElementById('rtDownloadDescription');
const genreButtons=[...panel.querySelectorAll('[data-rt-genre]')];
const sceneButtons=[...panel.querySelectorAll('[data-rt-scene]')];
const mixkit='Mixkit · Free Stock Music';
const genres={
 action:{title:'Action Audio Downloads',description:'Hero entries, fights, impact builds and battle energy.',items:[
  ['Epical Drums 01','Grigoriy Nuzhny','1:46','Percussion trailer · cinematic action','https://mixkit.co/free-stock-music/sound-elements/'],
  ['Epical Drums 06','Grigoriy Nuzhny','1:43','Percussion trailer · action / thriller','https://mixkit.co/free-stock-music/mood/suspenseful/'],
  ['Action Cinematic Music','PaulYudin','1:43','Epic action score · MP3','https://pixabay.com/music/main-title-action-cinematic-music-450665/']
 ]},
 romance:{title:'Romance Audio Downloads',description:'Love themes, soft meetings, longing and reunion moments.',items:[
  ['Beautiful Dream','Diego Nava','1:37','Romantic · acoustic guitar · love','https://mixkit.co/free-stock-music/mood/romantic/'],
  ['Romantic','Francisco Alvear','2:39','Film score · piano · wedding','https://mixkit.co/free-stock-music/mood/romantic/'],
  ['Love is Eternal','Ahjay Stelino','1:44','Atmospheric · instrumental · love','https://mixkit.co/free-stock-music/mood/romantic/']
 ]},
 thriller:{title:'Thriller / Suspense Audio Downloads',description:'Tension builds, villain reveals, mystery and confrontation.',items:[
  ['Fright Night','Michael Ramir C.','1:41','Dramatic · mysterious · cinematic thriller','https://mixkit.co/free-stock-music/mood/suspenseful/'],
  ['Echoes','Andrew Ev','3:46','Eerie atmosphere · synth · thriller','https://mixkit.co/free-stock-music/mood/suspenseful/'],
  ['Epical Drums 06','Grigoriy Nuzhny','1:43','Percussion trailer · action / thriller','https://mixkit.co/free-stock-music/mood/suspenseful/']
 ]},
 emotional:{title:'Emotional Audio Downloads',description:'Separation, sorrow, heartfelt moments and reunion.',items:[
  ['Silent Descent','Eugenio Mininni','2:40','Melancholic piano and strings','https://mixkit.co/free-stock-music/mood/sad/'],
  ['Drawing the Sky','Eugenio Mininni','3:27','Orchestral pop · cinematic drama','https://mixkit.co/free-stock-music/mood/sad/'],
  ['Ode to Loneliness','Diego Nava','1:59','Piano · mysterious · human drama','https://mixkit.co/free-stock-music/mood/sad/']
 ]},
 horror:{title:'Horror Audio Downloads',description:'Dark atmosphere, eerie reveals and fear builds.',items:[
  ['Piano Horror','Francisco Alvear','1:53','Eerie · nightmarish · cinematic thriller','https://mixkit.co/free-stock-music/tag/horror/'],
  ['Echoes','Andrew Ev','3:46','Eerie atmosphere · synth','https://mixkit.co/free-stock-music/tag/horror/'],
  ['Dark Shadows','Ahjay Stelino','1:46','Traditional · mysterious · horror','https://mixkit.co/free-stock-music/tag/horror/']
 ]},
 comedy:{title:'Comedy Audio Downloads',description:'Light, playful, quirky and fun scene backgrounds.',items:[
  ['Secret Garden','Eugenio Mininni','2:33','Playful strings · dramedy','https://mixkit.co/free-stock-music/tag/comedy/'],
  ['Comical','Ahjay Stelino','1:54','Playful drums and mallets','https://mixkit.co/free-stock-music/tag/comedy/'],
  ['Games Worldbeat','Bernardo R.','1:47','World · medieval · playful flute','https://mixkit.co/free-stock-music/tag/comedy/']
 ]},
 devotional:{title:'Devotional / Mythological Audio Downloads',description:'Spiritual, mystical, traditional and mythological atmosphere.',items:[
  ['Song of Kindness','Diego Nava','1:45','Religious · atmospheric · meditative','https://mixkit.co/free-stock-music/religious/'],
  ['I Believe','Michael Ramir C.','1:53','Religious · ethereal · atmospheric','https://mixkit.co/free-stock-music/religious/'],
  ['Indian Meditations','Ahjay Stelino','2:48','Traditional · mystical flute and percussion','https://mixkit.co/free-stock-music/world/'],
  ['How','Eugenio Mininni','2:43','Gregorian chant · mystical piano','https://mixkit.co/free-stock-music/tag/religion/']
 ]},
 epic:{title:'Epic / Heroic Audio Downloads',description:'Grand reveals, heroic elevation, orchestral builds and victory.',items:[
  ['Life’s a Movie','Arulo','2:01','Film score · brass · epic drama','https://mixkit.co/free-stock-music/mood/epic/'],
  ['Epical Drums 05','Grigoriy Nuzhny','1:42','Orchestral hybrid · dramatic brass and drums','https://mixkit.co/free-stock-music/mood/suspenseful/'],
  ['Cinematic Collection','Mixkit collection','108 tracks','Cinematic film-score and trailer music','https://mixkit.co/free-stock-music/tag/cinematic/']
 ]},
 adventure:{title:'Adventure / Fantasy Audio Downloads',description:'Journey, exploration, magical worlds and rescue missions.',items:[
  ['Games Worldbeat','Bernardo R.','1:47','World · medieval · cinematic flute','https://mixkit.co/free-stock-music/medieval/'],
  ['Condor','Eugenio Mininni','3:38','Medieval · hypnotic percussion','https://mixkit.co/free-stock-music/medieval/'],
  ['World Music Collection','Mixkit collection','74 tracks','World instruments and atmospheric themes','https://mixkit.co/free-stock-music/world/']
 ]}
};
const sceneGenres={
 'hero-intro':['action','epic','adventure'],
 'villain-intro':['thriller','horror','epic'],
 'heroine-intro':['romance','emotional','devotional'],
 'hero-villain':['action','thriller','epic'],
 'hero-heroine':['romance','emotional'],
 'villain-heroine':['thriller','emotional','horror'],
 'hanuman-sena':['adventure','epic','devotional','action'],
 emotional:['emotional','romance'],
 'action-climax':['action','epic','thriller']
};
let activeGenre='action';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderGenre(id){
 const genre=genres[id];if(!genre)return;
 activeGenre=id;
 genreButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtGenre===id));
 sceneButtons.forEach(button=>button.classList.remove('active'));
 title.textContent=genre.title;description.textContent=genre.description;
 status.textContent=genre.items.length+' curated downloadable picks · '+mixkit+' and other listed source providers.';
 grid.innerHTML=genre.items.map(item=>'<article class="rt-audio-card"><span class="rt-source-label rt-recommended">DOWNLOADABLE SOURCE</span><strong>'+safe(item[0])+'</strong><div class="rt-audio-meta">Artist: '+safe(item[1])+'<br>Duration: '+safe(item[2])+'<br>'+safe(item[3])+'<br>Source: '+(item[4].includes('mixkit.co')?'Mixkit · Free Stock Music':'Pixabay · Content License')+'</div><a class="rt-download-link" href="'+safe(item[4])+'" target="_blank" rel="noopener noreferrer">Download audio ↗</a></article>').join('');
}
function renderScene(id){
 const related=sceneGenres[id]||['action'];
 genreButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtGenre===related[0]));
 sceneButtons.forEach(button=>button.classList.toggle('active',button.dataset.rtScene===id));
 const names={ 'hero-intro':'Hero Intro','villain-intro':'Villain Intro','heroine-intro':'Heroine Intro','hero-villain':'Hero vs Villain','hero-heroine':'Hero vs Heroine','villain-heroine':'Ashokavanam','hanuman-sena':'Hanuman Sena','emotional':'Emotional / Separation','action-climax':'Action / Climax'};
 title.textContent=names[id]+' · Scene Audio Downloads';
 description.textContent='Scene ki match ayye genre-wise download collections.';
 const items=related.flatMap(key=>genres[key].items.map(item=>({genre:genres[key].title,item})));
 const seen=new Set();
 const unique=items.filter(x=>{const k=x.item[0]+'|'+x.item[4];if(seen.has(k))return false;seen.add(k);return true;});
 status.textContent=unique.length+' scene-matched downloadable picks.';
 grid.innerHTML=unique.map(x=>'<article class="rt-audio-card"><span class="rt-source-label">'+safe(x.genre)+'</span><strong>'+safe(x.item[0])+'</strong><div class="rt-audio-meta">Artist: '+safe(x.item[1])+'<br>Duration: '+safe(x.item[2])+'<br>'+safe(x.item[3])+'<br>Source: '+(x.item[4].includes('mixkit.co')?'Mixkit · Free Stock Music':'Pixabay · Content License')+'</div><a class="rt-download-link" href="'+safe(x.item[4])+'" target="_blank" rel="noopener noreferrer">Download audio ↗</a></article>').join('');
}
genreButtons.forEach(button=>button.addEventListener('click',()=>renderGenre(button.dataset.rtGenre)));
sceneButtons.forEach(button=>button.addEventListener('click',()=>renderScene(button.dataset.rtScene)));
const trailerTab=document.querySelector('[data-resource-view="trailer"]');
if(trailerTab)trailerTab.addEventListener('click',()=>{if(!grid.dataset.initialized){grid.dataset.initialized='true';renderGenre(activeGenre);}});
renderGenre(activeGenre);
})();