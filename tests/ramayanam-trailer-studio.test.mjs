import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findHeroes, findCategory, detectStoryBeats, scoreStorylineSimilarity, handleTrailerDiscovery } from '../worker/trailerDiscovery.ts';
const root=readFileSync(new URL('../workspace.html',import.meta.url),'utf8');
const pub=readFileSync(new URL('../public/workspace.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/ramayanam-trailer-studio.js',import.meta.url),'utf8');
const discovery=readFileSync(new URL('../worker/trailerDiscovery.ts',import.meta.url),'utf8');
const preview=readFileSync(new URL('../worker/preview.ts',import.meta.url),'utf8');

test('Trailer Studio keeps the two modules mirrored and names different-hero storyline matching',()=>{
 assert.equal(root,pub);
 assert.match(pub,/Different-Hero Storyline Match/);
 assert.match(pub,/Cross-Industry Recreation/);
 assert.match(pub,/Similar Story · Different Hero/);
 assert.match(pub,/Different hero తప్పనిసరి/);
 assert.doesNotMatch(pub,/Ramayanam|సీతాపహరణం|అరణ్యవాసం/);
 assert.doesNotMatch(pub,/tsVisualHero|tsVisualMovie|tsAudioHero|tsAudioMovie/);
 assert.match(pub,/id="cinematic-fonts"/);
 assert.match(pub,/id="myDrivePanel"/);
});

test('Story search calls the storyline endpoint and renders shared beats, different hero and sources',()=>{
 assert.match(js,/api\/trailer\/discover\?mode=story/);
 assert.match(js,/different-hero storyline candidate/);
 assert.match(js,/sharedBeats/);
 assert.match(js,/Original source/);
 assert.doesNotMatch(js,/Ramayanam|ramayanaEvent|Sita/);
});

test('Scene audio uses eligible sound API with inline preview and download controls',()=>{
 assert.match(js,/api\/resources\/sounds/);
 assert.match(js,/audio controls/);
 assert.match(js,/\/preview/);
 assert.match(js,/\/download/);
 assert.match(pub,/BGM \/ Music/);
 assert.match(pub,/Dialogue \/ Voice/);
 assert.match(pub,/Sound Effects/);
});

test('Cross-industry recreation and rights-safe workflow remain available',()=>{
 assert.match(js,/NEW SCENE CONCEPT/);
 assert.match(js,/Create original characters/);
 assert.match(pub,/My Drive/);
 assert.match(pub,/copyrighted scores are not scraped/);
});

test('Discovery backend integrates Google, YouTube and X search providers',()=>{
 assert.match(discovery,/googleapis\.com\/youtube\/v3\/search/);
 assert.match(discovery,/customsearch\/v1/);
 assert.match(discovery,/api\.x\.com\/2\/tweets\/search\/recent/);
 assert.match(discovery,/YOUTUBE_API_KEY/);
 assert.match(discovery,/GOOGLE_CSE_API_KEY/);
 assert.match(discovery,/X_BEARER_TOKEN/);
});

test('Hero and scene categorization supports distinct Telugu heroes',()=>{
 assert.deepEqual(findHeroes('Indra Chiranjeevi Telugu movie'),['Chiranjeevi']);
 assert.deepEqual(findHeroes('Aadhi Jr NTR Telugu movie'),['Jr NTR']);
 assert.equal(findCategory('mass hero entry scene').id,'hero-intro');
 assert.equal(findCategory('villain intro and hostage heroine').id,'villain-intro');
});

test('Story-beat similarity requires at least two shared events and returns explainable evidence',()=>{
 const source='A man returns to avenge his murdered father, protects his village from a powerful rival and faces a final showdown.';
 const candidate='After his father is murdered, a young man seeks revenge, protects his people from a ruthless gangster and confronts him in a final battle.';
 const result=scoreStorylineSimilarity(source,candidate);
 assert.equal(result.qualified,true);
 assert.ok(result.sharedBeats.length>=2);
 assert.ok(result.score>=40);
 assert.ok(result.sharedBeats.some(x=>x.id==='family-revenge'));
});

test('One shared genre/action clue is not enough to qualify a storyline match',()=>{
 const result=scoreStorylineSimilarity('A hero fights a powerful enemy in a final battle.','A hero fights a powerful enemy.');
 assert.equal(result.qualified,false);
});

test('Discovery reports missing provider credentials without fabricating matches',async()=>{
 const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?movie=Indra'),{});
 assert.equal(response.status,503);
 const body=await response.json();
 assert.deepEqual(body.requiredSecrets,['YOUTUBE_API_KEY','GOOGLE_CSE_API_KEY','GOOGLE_CSE_CX','X_BEARER_TOKEN']);
 assert.equal(body.results,undefined);
});

test('Storyline discovery returns a different-hero film with multiple shared plot beats',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{
   const u=new URL(String(input));
   if(u.hostname==='www.googleapis.com'&&u.pathname==='/customsearch/v1'){
    const q=u.searchParams.get('q')||'';
    const item=q.includes('full story plot synopsis hero actor')
     ?{title:'Indra Telugu film Chiranjeevi',snippet:'Chiranjeevi returns to avenge his murdered father, protects his village from a powerful faction rival and faces a final showdown.',link:'https://example.test/indra'}
     :{title:'Aadhi Telugu film Jr NTR',snippet:'Jr NTR seeks revenge after his father is murdered, protects his people from a powerful faction leader and confronts him in the final battle.',link:'https://example.test/aadhi'};
    return new Response(JSON.stringify({items:[item]}),{status:200,headers:{'Content-Type':'application/json'}});
   }
   if(u.hostname==='www.googleapis.com'&&u.pathname==='/youtube/v3/search')return new Response(JSON.stringify({items:[]}),{status:200,headers:{'Content-Type':'application/json'}});
   if(u.hostname==='api.x.com')return new Response(JSON.stringify({data:[]}),{status:200,headers:{'Content-Type':'application/json'}});
   throw new Error('Unexpected provider request: '+u.href);
  };
  const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?mode=story&movie=Indra'),{GOOGLE_CSE_API_KEY:'test-key',GOOGLE_CSE_CX:'test-cx'});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.visualHero,'Chiranjeevi');
  assert.ok(body.matches.some(x=>x.title.includes('Aadhi')&&x.hero==='Jr NTR'&&x.sharedBeats.length>=2));
  assert.ok(body.matches[0].sources[0].url.startsWith('https://example.test/'));
 }finally{globalThis.fetch=originalFetch;}
});

test('Isolated preview protects provider-backed discovery with a separate preview login',()=>{
 assert.match(preview,/PREVIEW_ADMIN_PASSWORD/);
 assert.match(preview,/api\/admin\/login/);
 assert.match(preview,/if \(!await previewSession\(request, env\)\)/);
 assert.match(preview,/handleTrailerDiscovery\(request, env\)/);
});
