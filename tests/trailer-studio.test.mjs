import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findHeroes, detectStoryBeats, scoreStorylineSimilarity, handleTrailerDiscovery } from '../worker/trailerDiscovery.ts';
const workspace=readFileSync(new URL('../workspace.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../public/trailer-studio.js',import.meta.url),'utf8');
const backend=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
test('Trailer Studio is added as a separate Editor Workspace resource without replacing existing libraries',()=>{
 assert.match(workspace,/data-resource-view="sounds"/);assert.match(workspace,/data-resource-view="fonts"/);assert.match(workspace,/data-resource-view="my-drive"/);assert.match(workspace,/data-resource-view="trailer"/);
 assert.match(workspace,/id="trailerStudio"/);assert.match(workspace,/id="cinematic-sfx"/);assert.match(workspace,/id="myDrivePanel"/);
 assert.match(workspace,/trailer-studio\.js/);
});
test('Story matching UI shows different hero, shared beats and original evidence links',()=>{
 assert.match(ui,/mode=story/);assert.match(ui,/different-hero match/);assert.match(ui,/sharedBeats/);assert.match(ui,/Original source|source/);
 assert.match(ui,/api\/resources\/sounds/);assert.match(ui,/audio controls/);assert.match(ui,/\/download/);
});
test('Only a different identified Telugu hero and multiple story events can qualify',()=>{
 assert.deepEqual(findHeroes('Indra Telugu movie Chiranjeevi'),['Chiranjeevi']);
 assert.deepEqual(findHeroes('Aadhi Telugu movie Jr NTR'),['Jr NTR']);
 const source='A man returns to avenge his murdered father, protects his village from a powerful rival and faces a final showdown.';
 const candidate='After his father is murdered, a young man seeks revenge, protects his people from a powerful faction leader and confronts him in a final battle.';
 const match=scoreStorylineSimilarity(source,candidate);assert.equal(match.qualified,true);assert.ok(match.sharedBeats.length>=2);
 assert.equal(scoreStorylineSimilarity('A hero fights a powerful enemy in a final battle.','A hero fights a powerful enemy.').qualified,false);
 assert.ok(detectStoryBeats(source).length>=2);
});
test('Discovery endpoint is public but returns an honest provider-configuration error instead of fabricated matches',async()=>{
 const response=await handleTrailerDiscovery(new Request('https://preview.test/api/trailer/discover?mode=story&movie=Indra'),{});
 assert.equal(response.status,503);const body=await response.json();assert.ok(body.error);assert.equal(body.results,undefined);
 const publicRoute=backend.indexOf("handleTrailerDiscovery(req,env)");const adminGate=backend.indexOf("if(!await validSession(req,env))");
 assert.ok(publicRoute>=0&&adminGate>publicRoute,'public discovery route must run before the admin-session gate');
 assert.match(backend,/public\\/trailer-rate/);
});
