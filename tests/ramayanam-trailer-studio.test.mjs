import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=readFileSync(new URL('../workspace.html',import.meta.url),'utf8');
const pub=readFileSync(new URL('../public/workspace.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/ramayanam-trailer-studio.js',import.meta.url),'utf8');
const discovery=readFileSync(new URL('../worker/trailerDiscovery.ts',import.meta.url),'utf8');

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
 assert.match(discovery,/youtube\.googleapis\.com/);
 assert.match(discovery,/customsearch\/v1/);
 assert.match(discovery,/api\.x\.com\/2\/tweets\/search\/recent/);
 assert.match(discovery,/different.length!==1/);
 assert.match(discovery,/YOUTUBE_API_KEY/);
 assert.match(discovery,/GOOGLE_CSE_API_KEY/);
 assert.match(discovery,/X_BEARER_TOKEN/);
});
