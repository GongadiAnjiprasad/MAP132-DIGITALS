import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findHeroes, findCategory, handleTrailerDiscovery, matchRamayanaStoryPatterns } from '../worker/trailerDiscovery.ts';
const root=readFileSync(new URL('../workspace.html',import.meta.url),'utf8');
const pub=readFileSync(new URL('../public/workspace.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/ramayanam-trailer-studio.js',import.meta.url),'utf8');
const discovery=readFileSync(new URL('../worker/trailerDiscovery.ts',import.meta.url),'utf8');
const preview=readFileSync(new URL('../worker/preview.ts',import.meta.url),'utf8');

test('Trailer Studio has two generic modules, separate heroes and a mirrored workspace',()=>{
 assert.equal(root,pub);
 assert.match(pub,/Story Adaptation/);
 assert.match(pub,/Cross-Industry Recreation/);
 assert.match(pub,/tsStoryForm/);
 assert.match(pub,/tsCrossForm/);
 assert.match(pub,/మీ Visual Reference సినిమా పేరు/);
 assert.match(pub,/Matching Audio వెతుకు/);
 assert.match(pub,/Audio movie name ఇవ్వాల్సిన అవసరం లేదు/);
 assert.doesNotMatch(pub,/tsVisualHero|tsVisualMovie|tsAudioHero|tsAudioMovie/);
 assert.doesNotMatch(pub,/data-resource-view="sounds"|id="cinematic-sfx"/);
 assert.match(pub,/id="cinematic-fonts"/);
 assert.match(pub,/id="myDrivePanel"/);
 assert.doesNotMatch(pub,/RAMA: THE VARSHAM SAGA|Varsham reimagined/);
});

test('Story Adaptation uses public video/social discovery and cross-hero evidence',()=>{
 assert.match(js,/api\/trailer\/discover/);
 assert.match(js,/YouTube, Google Search, X/);
 assert.match(js,/cross-hero public reference/);
 assert.doesNotMatch(js.slice(js.indexOf('async function runStorySearch'),js.indexOf('function bindFilmButtons')),/searchWiki|wikipedia/i);
});

test('Scene audio uses the existing eligible sound API and inline preview controls',()=>{
 assert.match(js,/api\/resources\/sounds/);
 assert.match(js,/audio controls/);
 assert.match(js,/\/preview/);
 assert.match(js,/\/download/);
 assert.match(pub,/BGM \/ Music/);
 assert.match(pub,/Dialogue \/ Voice/);
 assert.match(pub,/Sound Effects/);
});

test('Cross-industry recreation supports original concept notes and rights-safe workflow',()=>{
 assert.match(js,/NEW SCENE CONCEPT/);
 assert.match(js,/Create original characters/);
 assert.match(pub,/My Drive/);
 assert.match(pub,/copyrighted scores are not scraped/);
});

test('Discovery backend integrates YouTube, Google Search and X APIs with strict hero filtering',()=>{
 assert.match(discovery,/googleapis\.com\/youtube\/v3\/search/);
 assert.match(discovery,/customsearch\/v1/);
 assert.match(discovery,/api\.x\.com\/2\/tweets\/search\/recent/);
 assert.match(discovery,/different.length!==1/);
 assert.match(discovery,/YOUTUBE_API_KEY/);
 assert.match(discovery,/GOOGLE_CSE_API_KEY/);
 assert.match(discovery,/X_BEARER_TOKEN/);
});

test('Hero and scene categorization rejects same-hero references',()=>{
 assert.deepEqual(findHeroes('Pushpa Allu Arjun hero intro'),['Allu Arjun']);
 assert.deepEqual(findHeroes('Prabhas and Allu Arjun face off'),['Prabhas','Allu Arjun']);
 assert.equal(findCategory('mass hero entry scene').id,'hero-intro');
 assert.equal(findCategory('villain intro and hostage heroine').id,'villain-intro');
});

test('Discovery reports missing provider credentials without fabricating matches',async()=>{
 const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?movie=Salaar'),{});
 assert.equal(response.status,503);
 const body=await response.json();
 assert.deepEqual(body.requiredSecrets,['YOUTUBE_API_KEY','GOOGLE_CSE_API_KEY','GOOGLE_CSE_CX','X_BEARER_TOKEN']);
 assert.equal(body.results,undefined);
});

test('Discovery returns only explicitly different-hero YouTube results',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const u=new URL(String(input));const q=u.searchParams.get('q')||'';
   const items=q.includes('cast hero actor')?
    [{id:{videoId:'cast1'},snippet:{title:'Salaar Telugu movie cast Prabhas'}}]:
    [{id:{videoId:'candidate1'},snippet:{title:'Pushpa Allu Arjun hero intro fan edit',description:'Tollywood mass entry'}},{id:{videoId:'mixed'},snippet:{title:'Prabhas and Allu Arjun mashup',description:'face off scene'}}];
   return new Response(JSON.stringify({items}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?movie=Salaar'),{YOUTUBE_API_KEY:'test-key'});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.visualHero,'Prabhas');
  assert.equal(body.results.length,1);
  assert.equal(body.results[0].hero,'Allu Arjun');
  assert.equal(body.results[0].videoId,'candidate1');
  assert.equal(body.results[0].category,'hero-intro');
 }finally{globalThis.fetch=originalFetch;}
});

test('Isolated preview protects provider-backed discovery with a separate preview login',()=>{
 assert.match(preview,/PREVIEW_ADMIN_PASSWORD/);
 assert.match(preview,/api\/admin\/login/);
 assert.match(preview,/if \(!await previewSession\(request, env\)\)/);
 assert.match(preview,/handleTrailerDiscovery\(request, env\)/);
});

\ntest('Story matching maps Varsham kidnapping, forced marriage and rescue to the Sita abduction arc',()=>{
 const matches=matchRamayanaStoryPatterns('Bhadranna kidnaps Sailaja and attempts to force her into marriage. Venkat brings Sailaja back and rescues her.');
 assert.ok(matches.some(x=>x.storyBeatId==='sita-abduction-rescue'&&x.forcedMarriage===true&&x.abduction===true&&x.rescue===true));
});
\ntest('Story matching does not claim a complete Ramayana event from kidnapping alone',()=>{
 const matches=matchRamayanaStoryPatterns('Bhadranna kidnaps Sailaja and takes her away.');
 assert.equal(matches.some(x=>x.storyBeatId==='sita-abduction-rescue'),false);
});
\ntest('Story endpoint returns evidence-backed event matches without requiring hero separation',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const u=new URL(String(input));
   if(u.hostname==='www.googleapis.com'&&u.pathname==='/customsearch/v1')return new Response(JSON.stringify({items:[{title:'Varsham Telugu movie story',snippet:'Bhadranna kidnaps Sailaja and attempts to force her into marriage. Venkat rescues Sailaja and brings her back.',link:'https://example.test/varsham-story'}]}),{status:200,headers:{'Content-Type':'application/json'}});
   return new Response(JSON.stringify({items:[]}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?mode=story&movie=Varsham'),{GOOGLE_CSE_API_KEY:'test-key',GOOGLE_CSE_CX:'test-cx'});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.matches.length,1);
  assert.equal(body.matches[0].storyBeatId,'sita-abduction-rescue');
  assert.equal(body.matches[0].forcedMarriage,true);
  assert.equal(body.matches[0].sources[0].url,'https://example.test/varsham-story');
 }finally{globalThis.fetch=originalFetch;}
});
\ntest('Story endpoint returns no complete match when plot evidence is incomplete',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({items:[{title:'Varsham movie story',snippet:'Bhadranna kidnaps Sailaja.',link:'https://example.test/varsham'}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?mode=story&movie=Varsham'),{GOOGLE_CSE_API_KEY:'test-key',GOOGLE_CSE_CX:'test-cx'});
  const body=await response.json();
  assert.equal(body.matches.length,0);
  assert.equal(body.partialEvidence.length,1);
 }finally{globalThis.fetch=originalFetch;}
});
