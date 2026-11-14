const HEROES=[['Prabhas',['prabhas']],['Jr NTR',['jr ntr','n.t. rama rao jr','rama rao jr']],['Ram Charan',['ram charan']],['Allu Arjun',['allu arjun']],['Mahesh Babu',['mahesh babu']],['Pawan Kalyan',['pawan kalyan']],['Chiranjeevi',['chiranjeevi']],['Venkatesh',['venkatesh']],['Nagarjuna',['nagarjuna']],['Nani',['nani']],['Ravi Teja',['ravi teja']],['Vijay Deverakonda',['vijay deverakonda']],['Balakrishna',['balakrishna','nbk']],['Sharwanand',['sharwanand']],['Gopichand',['gopichand']],['Varun Tej',['varun tej']],['Sai Dharam Tej',['sai dharam tej']],['Adivi Sesh',['adivi sesh']],['Nithiin',['nithiin']],['Ram Pothineni',['ram pothineni']],['Naga Chaitanya',['naga chaitanya']],['Akhil Akkineni',['akhil akkineni']],['Siddhu Jonnalagadda',['siddhu jonnalagadda']]];
const CATS=[['hero-intro','హీరో పరిచయం',['hero intro','hero introduction','entry scene','mass entry']],['villain-intro','విలన్ పరిచయం',['villain intro','villain introduction']],['heroine-intro','హీరోయిన్ పరిచయం',['heroine intro']],['faceoff','హీరో–విలన్ ఎదురెదురు',['face off','face-off','showdown','confrontation']],['heroine-control','విలన్ హీరోయిన్‌ను అదుపులో ఉంచే సీన్',['hostage','kidnap','held captive','rescue heroine']],['fight','ఫైట్ / యాక్షన్',['fight','action scene','stunt','combat','battle']],['emotion','ఎమోషనల్ సీన్',['emotional','sentiment','crying','reveal']],['climax','క్లైమాక్స్',['climax','finale','final fight']],['romance','హీరో–హీరోయిన్ సీన్',['romance','love scene','romantic']],['dialogue','పవర్‌ఫుల్ డైలాగ్',['dialogue','punch dialogue','monologue']],['bgm','BGM / మ్యూజిక్',['bgm','background score','theme music','soundtrack']]];
const clean=s=>String(s||'').toLowerCase().replace(/[^a-z0-9. ]/g,' ').replace(/\s+/g,' ').trim();
export function findHeroes(text){const s=clean(text);return HEROES.filter(([,a])=>a.some(x=>s.includes(clean(x)))).map(x=>x[0]);}
export function findCategory(text){const s=clean(text);for(const [id,label,terms] of CATS)if(terms.some(t=>s.includes(clean(t))))return{id,label};return{id:'other',label:'ఇతర fan discussion'};}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function google(q,e){if(!e.GOOGLE_CSE_API_KEY||!e.GOOGLE_CSE_CX)return[];const u=new URL('https://www.googleapis.com/customsearch/v1');u.search=new URLSearchParams({key:e.GOOGLE_CSE_API_KEY,cx:e.GOOGLE_CSE_CX,q,num:'10'}).toString();const r=await fetch(u);if(!r.ok)throw Error('Google Search returned '+r.status);const j=await r.json();return(j.items||[]).map(x=>({source:'Google',title:x.title||'',description:x.snippet||'',url:x.link||''}));}
async function youtube(q,e){if(!e.YOUTUBE_API_KEY)return[];const u=new URL('https://www.googleapis.com/youtube/v3/search');u.search=new URLSearchParams({key:e.YOUTUBE_API_KEY,part:'snippet',type:'video',maxResults:'15',q}).toString();const r=await fetch(u);if(!r.ok)throw Error('YouTube returned '+r.status);const j=await r.json();return(j.items||[]).map(x=>({source:'YouTube',title:x.snippet?.title||'',description:x.snippet?.description||'',url:'https://www.youtube.com/watch?v='+x.id.videoId,videoId:x.id?.videoId||''})).filter(x=>x.videoId);}
async function xsearch(q,e){if(!e.X_BEARER_TOKEN)return[];const u=new URL('https://api.x.com/2/tweets/search/recent');u.search=new URLSearchParams({query:q+' -is:retweet',max_results:'20','tweet.fields':'created_at,author_id','expansions':'author_id','user.fields':'username,name'}).toString();const r=await fetch(u,{headers:{Authorization:'Bearer '+e.X_BEARER_TOKEN}});if(!r.ok)throw Error('X returned '+r.status);const j=await r.json(),users=new Map((j.includes?.users||[]).map(x=>[x.id,x.username]));return(j.data||[]).map(x=>({source:'X',title:'@'+(users.get(x.author_id)||'user')+' · public post',description:x.text||'',url:'https://x.com/i/web/status/'+x.id}));}

const STORY_BEATS=[
 {id:'family-revenge',label:'కుటుంబ ప్రతీకారం',terms:/revenge|avenge|retaliat|murder(?:ed)? (?:his|her|their) (?:father|mother|brother|family)|family (?:was|is) (?:killed|murdered|destroyed)/i},
 {id:'hidden-identity',label:'రహస్య గుర్తింపు / గతం',terms:/secret identity|hidden identity|reveals? (?:his|her) identity|past catches up|unknown heir|mysterious past/i},
 {id:'protect-innocent',label:'బలహీనులను / కుటుంబాన్ని కాపాడటం',terms:/protect(?:s|ing)? (?:his|her|their )?(?:family|village|people|sister|mother|daughter)|save(?:s|d)? (?:his|her|their )?(?:family|village|people|sister|mother|daughter)/i},
 {id:'undercover-infiltration',label:'మారువేషం / రహస్య ప్రవేశం',terms:/undercover|infiltrat|goes undercover|assumes? (?:a )?new identity|disguise[sd]?/i},
 {id:'wronged-outcast',label:'అన్యాయానికి గురై తిరిగి రావడం',terms:/framed for|wrongly accused|exiled|banished|forced to leave|returns? to (?:his|her|their )?(?:village|hometown|kingdom)/i},
 {id:'powerful-antagonist',label:'శక్తివంతమైన ప్రత్యర్థితో పోరాటం',terms:/powerful (?:gangster|don|warlord|politician|rival|enemy)|feud with|takes on|confronts? (?:a )?(?:powerful|ruthless|rival)/i},
 {id:'love-sacrifice',label:'ప్రేమ / త్యాగం',terms:/sacrific(?:e|es|ed|ing)|for the love of|protect (?:his|her) love|loved one|romance|falls in love/i},
 {id:'rescue-hostage',label:'అపహరణ / బంధనం నుంచి రక్షణ',terms:/kidnap|abduct|hostage|held captive|captivated|rescu(?:e|es|ed|ing) (?:his|her|the|a)/i},
 {id:'moral-redemption',label:'తప్పు తెలుసుకుని మార్పు / విముక్తి',terms:/redemption|redeems himself|seeks forgiveness|atones for|turns over a new leaf/i},
 {id:'final-showdown',label:'చివరి ముఖాముఖి / తుది పోరాటం',terms:/final showdown|climactic battle|final battle|ultimate confrontation|faces? off against/i}
];
export function detectStoryBeats(text){
 const s=String(text||'');return STORY_BEATS.filter(b=>b.terms.test(s)).map(b=>({id:b.id,label:b.label}));
}
export function scoreStorylineSimilarity(sourceText,candidateText){
 const source=detectStoryBeats(sourceText),candidate=detectStoryBeats(candidateText),candidateIds=new Set(candidate.map(x=>x.id));
 const shared=source.filter(x=>candidateIds.has(x.id));
 const score=source.length?Math.round(shared.length/source.length*100):0;
 return {score,sourceBeats:source,candidateBeats:candidate,sharedBeats:shared,qualified:shared.length>=2&&score>=40};
}
async function handleStorylineMatch(movie,env,configured){
 const sourceQuery='"'+movie+'" Telugu film full story plot synopsis hero actor';
 const sourceTasks=[google(sourceQuery,env),youtube('"'+movie+'" Telugu movie full story plot hero cast',env),xsearch('"'+movie+'" Telugu movie story OR plot',env)];
 const sourceSettled=await Promise.allSettled(sourceTasks),sourceItems=sourceSettled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
 const sourceText=sourceItems.map(x=>(x.title||'')+' '+(x.description||'')).join('\n');
 const sourceBeats=detectStoryBeats(sourceText),sourceHeroes=[...new Set(sourceItems.flatMap(x=>findHeroes((x.title||'')+' '+(x.description||''))))];
 if(!sourceItems.length||sourceBeats.length<2)return json({movie,matches:[],error:'ఈ సినిమా కథకు సరిపడా public plot evidence దొరకలేదు. కనీసం రెండు కథా సంఘటనలు నిర్ధారించకుండా reference చూపించము.',configured,providersUsed:[...new Set(sourceItems.map(x=>x.source))],providerErrors:sourceSettled.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||'Provider failed'))},422);
 const beatTerms=sourceBeats.map(x=>x.label).join(' ');
 const candidateQueries=[
  'Telugu movie similar storyline '+beatTerms+' different hero',
  'Tollywood film plot synopsis '+beatTerms,
  'Telugu films same story themes '+beatTerms,
  '"'+movie+'" similar Telugu movies different hero storyline'
 ];
 const candidateSettled=await Promise.allSettled(candidateQueries.flatMap(q=>[google(q,env),youtube(q+' Telugu movie plot cast',env)]).concat([xsearch('"'+movie+'" "similar story" OR "same storyline" Telugu movie',env)]));
 const candidateItems=candidateSettled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
 const sourceHero=sourceHeroes.length===1?sourceHeroes[0]:null,grouped=new Map(),partial=[];
 for(const item of candidateItems){
  const title=String(item.title||'').trim(),description=String(item.description||''),text=title+' '+description;
  if(!title||!item.url||clean(title).includes(clean(movie)))continue;
  const heroes=[...new Set(findHeroes(text))];
  if(!sourceHero||heroes.length!==1||heroes[0]===sourceHero)continue;
  const similarity=scoreStorylineSimilarity(sourceText,text);
  if(!similarity.qualified){if(similarity.sharedBeats.length&&partial.length<6)partial.push({title,evidence:description||title,url:item.url,sharedBeats:similarity.sharedBeats});continue;}
  const key=clean(title).replace(/\b(full movie|trailer|teaser|review|explained|fan edit)\b/g,'').trim();
  const current=grouped.get(key)||{title,hero:heroes[0],score:similarity.score,sharedBeats:similarity.sharedBeats,sources:[]};
  if(item.url&&!current.sources.some(x=>x.url===item.url))current.sources.push({source:item.source,title,evidence:description||title,url:item.url,videoId:item.videoId||''});
  current.score=Math.max(current.score,similarity.score);
  grouped.set(key,current);
 }
 const matches=[...grouped.values()].sort((a,b)=>b.score-a.score||b.sharedBeats.length-a.sharedBeats.length).slice(0,8).map(x=>({...x,reason:'ఈ రెండు సినిమాల్లో '+x.sharedBeats.map(b=>b.label).join(', ')+' వంటి కథా మలుపులు పోలి ఉన్నాయి. ఇది public plot text ఆధారిత candidate; పూర్తి కథ/సన్నివేశం చూసి నిర్ధారించాలి.',matchStrength:x.score>=70?'strong':'possible',sources:x.sources.slice(0,4)}));
 return json({movie,visualHero:sourceHero,sourceEvidence:sourceItems.slice(0,5).map(x=>({source:x.source,title:x.title,evidence:x.description||x.title,url:x.url})),sourceBeats,matches,partialEvidence:partial,configured,providersUsed:[...new Set([...sourceItems,...candidateItems].map(x=>x.source))],providerErrors:[...sourceSettled,...candidateSettled].filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||'Provider failed')),notice:'Cross-movie matches use public search snippets and a conservative shared-story-beat score. They are candidates, not full-screenplay analysis. Open source links and review actual scenes before editing.'});
}

export async function handleTrailerDiscovery(req,env){const u=new URL(req.url);if(u.pathname!=='/api/trailer/discover')return null;if(req.method!=='GET')return json({error:'Use GET.'},405);const movie=(u.searchParams.get('movie')||'').trim();if(movie.length<2||movie.length>100)return json({error:'సినిమా పేరు 2–100 అక్షరాల మధ్య ఇవ్వండి.'},400);const configured={youtube:!!env.YOUTUBE_API_KEY,google:!!(env.GOOGLE_CSE_API_KEY&&env.GOOGLE_CSE_CX),x:!!env.X_BEARER_TOKEN};if(!Object.values(configured).some(Boolean))return json({error:'Public search providers are not configured yet.',requiredSecrets:['YOUTUBE_API_KEY','GOOGLE_CSE_API_KEY','GOOGLE_CSE_CX','X_BEARER_TOKEN'],configured},503);
if(u.searchParams.get('mode')==='story')return await handleStorylineMatch(movie,env,configured);try{const cast='"'+movie+'" Telugu movie cast hero actor',castSettled=await Promise.allSettled([google(cast,env),youtube(cast,env),xsearch('"'+movie+'" Telugu hero',env)]),castItems=castSettled.flatMap(x=>x.status==='fulfilled'?x.value:[]),counts=new Map();for(const item of castItems)for(const h of findHeroes(item.title+' '+item.description))counts.set(h,(counts.get(h)||0)+1);const ranked=[...counts].sort((a,b)=>b[1]-a[1]);if(!ranked.length)return json({error:'Public search snippetsలో ఈ సినిమా హీరోను గుర్తించలేకపోయాం. తప్పు match చూపించలేదు.',configured},422);if(ranked.length>1&&ranked[0][1]===ranked[1][1])return json({error:'Visual Reference హీరోపై search results స్పష్టంగా లేవు. తప్పుగా ఎంపిక చేయకుండా ఆపేశాం.',heroCandidates:ranked.slice(0,4).map(x=>x[0]),configured},422);const visualHero=ranked[0][0],others=HEROES.map(x=>x[0]).filter(x=>x!==visualHero),q='"'+movie+'" Telugu fan edit scene dialogue BGM OR Tollywood '+others.join(' OR '),settled=await Promise.allSettled([google(q,env),youtube(q,env),xsearch('"'+movie+'" Telugu fan edit OR dialogue OR BGM OR scene',env)]),all=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]),results=[],seen=new Set();for(const item of all){const actors=findHeroes(item.title+' '+item.description),different=actors.filter(x=>x!==visualHero);if(actors.includes(visualHero)||different.length!==1||!item.url||seen.has(item.url))continue;seen.add(item.url);const c=findCategory(item.title+' '+item.description);results.push({...item,hero:different[0],category:c.id,categoryLabel:c.label,matchEvidence:'Public title/description/post text mentions this other hero. Scene fit still needs playback review.'});}return json({movie,visualHero,results:results.slice(0,30),configured,providersUsed:[...new Set(all.map(x=>x.source))],providerErrors:settled.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||'Provider failed')),notice:'Fan edits/posts are discovery clues, not proof of original movie-audio rights. YouTube embeds can be previewed; copyrighted movie audio is not extracted.'});}catch(error){return json({error:error instanceof Error?error.message:'Search failed.',configured},502);}}
