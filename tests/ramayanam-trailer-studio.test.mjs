import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root=readFileSync(new URL('../workspace.html',import.meta.url),'utf8');
const pub=readFileSync(new URL('../public/workspace.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/ramayanam-trailer-studio.js',import.meta.url),'utf8');

test('Trailer Studio has two generic modules, separate heroes and a mirrored workspace',()=>{
 assert.equal(root,pub);
 assert.match(pub,/Story Adaptation/);
 assert.match(pub,/Cross-Industry Recreation/);
 assert.match(pub,/tsStoryForm/);
 assert.match(pub,/tsCrossForm/);
 assert.match(pub,/ఒక సినిమా పేరు ఇవ్వండి/);
 assert.doesNotMatch(pub,/tsVisualHero|tsVisualMovie|tsAudioHero|tsAudioMovie/);
 assert.doesNotMatch(pub,/data-resource-view="sounds"|id="cinematic-sfx"/);
 assert.match(pub,/id="cinematic-fonts"/);
 assert.match(pub,/id="myDrivePanel"/);
 assert.doesNotMatch(pub,/RAMA: THE VARSHAM SAGA|Varsham reimagined/);
});

test('Story Adaptation enforces different Tollywood heroes and explains scene cues in Telugu',()=>{
 assert.match(js,/identifyHero/);
 assert.match(js,/వేరే హీరోతో ఉన్న రెండో Tollywood సినిమా/);
 assert.match(js,/telugu\|tollywood/i);
 assert.match(js,/VISUAL REFERENCE/);
 assert.match(js,/AUDIO REFERENCE/);
 assert.match(js,/హీరో \/ పాత్ర పరిచయం/);
 assert.match(js,/కథా సారాంశంలోని పదాల ఆధారంగా/);
});

test('Discovery uses live public article search and discloses text-based matching',()=>{
 assert.match(js,/en\.wikipedia\.org\/w\/api\.php/);
 assert.match(js,/searchWiki/);
 assert.match(js,/tsTargetIndustry/);
 assert.match(js,/detectCues/);
 assert.match(js,/text match only|plot-text|plot cues/i);
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
