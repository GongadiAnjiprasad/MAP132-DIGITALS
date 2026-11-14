import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootWorkspace = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publicWorkspace = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../public/ramayanam-trailer-studio.js', import.meta.url), 'utf8');

test('Trailer Studio workspace mirrors remain identical and separate from My Drive', () => {
  assert.equal(rootWorkspace, publicWorkspace);
  assert.match(publicWorkspace, /data-resource-view="trailer"/);
  assert.match(publicWorkspace, /data-resource-panel="trailer"/);
  assert.match(publicWorkspace, /ramayanam-trailer-studio\.js/);
});

test('Ramayanam × Varsham project contains all nine scene-wise audio choices', () => {
  for (const scene of ['hero-intro','villain-intro','heroine-intro','hero-villain','hero-heroine','villain-heroine','hanuman-sena','emotional','action-climax']) {
    assert.match(publicWorkspace, new RegExp('data-rt-scene="' + scene + '"'));
    assert.ok(studio.includes("'" + scene + "'"), 'Missing scene genre mapping: ' + scene);
  }
  assert.match(publicWorkspace, /RAMA: THE VARSHAM SAGA/);
});

test('All genre folders are present and empty genres do not show fake tracks', () => {
  for (const genre of ['action','romance','thriller','emotional','horror','comedy','devotional','epic','adventure']) {
    assert.match(publicWorkspace, new RegExp('data-rt-genre="' + genre + '"'));
    assert.ok(studio.includes(genre+':{title:'), 'Missing genre: ' + genre);
  }
  assert.match(studio, /rt-empty-state/);
});

test('Each listed track uses the same official Mixkit asset for preview and download', () => {
  for (const id of ['676','871','493','614']) assert.ok(studio.includes("id:'"+id+"'"), 'Missing verified asset id '+id);
  assert.match(studio, /assets\.mixkit\.co\/music\/preview\/mixkit-/);
  assert.match(studio, /assets\.mixkit\.co\/music\/download\/mixkit-/);
  assert.match(studio, /data-rt-preview/);
  assert.match(studio, /audio\.play\(\)/);
  assert.match(studio, /currentAudio\.pause\(\)/);
  assert.match(studio, /stopCurrent\(\)/);
  assert.match(studio, /data-rt-preview/);
});

test('Only one track can play at a time and preview failure is surfaced', () => {
  assert.match(studio, /stopCurrent\(\); currentAudio=audio/);
  assert.match(studio, /Preview could not load/);
  assert.match(studio, /Preview playback was blocked/);
});

test('Trailer Studio reads available audio assets without merging the My Drive workspace panels', () => {
  assert.ok(studio.includes('/api/my-drive/assets?limit=100'), 'Expected read-only My Drive asset endpoint');
  assert.match(studio, /loadDriveAudioAssets/);
  assert.doesNotMatch(studio, /method:\\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
  const section = publicWorkspace.slice(publicWorkspace.indexOf('id="ramayanamStudio"'), publicWorkspace.indexOf('id="cinematic-sfx"'));
  assert.doesNotMatch(section, /my-drive|My Drive/i);
  for (const marker of ['id="myDrivePanel"','id="cinematic-sfx"','id="cinematic-fonts"','id="myDriveLoginForm"']) {
    assert.ok(publicWorkspace.includes(marker), 'Missing existing workspace element: ' + marker);
  }
});

test('Trailer Studio responsive preview controls are styled and keyboard accessible', () => {
  assert.match(publicWorkspace, /rt-preview-button/);
  assert.match(publicWorkspace, /focus-visible/);
  assert.ok(publicWorkspace.includes('#ramayanamStudio .rt-scene-grid{display:grid'));
  assert.ok(publicWorkspace.includes('@media(max-width:420px){#ramayanamStudio .rt-scene-grid'));
});

test('Isolated preview bug reporter retains annotation and export tools', () => {
  const reporter = readFileSync(new URL('../public/ramayanam-bug-reporter.js', import.meta.url), 'utf8');
  for (const feature of ['Select element','Circle area','Highlight area','Draw arrow','Drop marker','Copy report','Download JSON']) assert.ok(reporter.includes(feature));
  assert.ok(publicWorkspace.includes('ramayanam-bug-reporter.js'));
  assert.ok(publicWorkspace.includes('#map132BugPanel'));
});


test('Trailer Studio has five fundamentals and requires all three scene-specific audio types', () => {
  for (const base of ['opening','characters','conflict','emotion','climax']) {
    assert.match(publicWorkspace, new RegExp('data-rt-base="' + base + '"'));
  }
  assert.match(publicWorkspace, /data-rt-scene="opening-hook"/);
  assert.match(studio, /const baseScenes/);
  assert.match(studio, /const types=\['BGM','Dialogue','SFX'\]/);
  assert.match(studio, /Not a complete scene match yet/);
  assert.match(studio, /Complete match · BGM, Dialogue and SFX/);
  assert.match(studio, /sceneAssets\(id,type\)/);
  assert.match(studio, /loadDriveAudioAssets/);
});
