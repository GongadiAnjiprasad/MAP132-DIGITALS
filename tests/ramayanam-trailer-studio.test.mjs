import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootWorkspace = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publicWorkspace = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../public/ramayanam-trailer-studio.js', import.meta.url), 'utf8');

test('Trailer Studio workspace mirrors remain identical and are a separate Editor Workspace tab', () => {
  assert.equal(rootWorkspace, publicWorkspace);
  assert.match(publicWorkspace, /data-resource-view="trailer"/);
  assert.match(publicWorkspace, /data-resource-panel="trailer"/);
  assert.match(publicWorkspace, /ramayanam-trailer-studio\.js/);
});

test('Ramayanam × Varsham project contains all nine scene-wise audio download choices', () => {
  for (const scene of ['hero-intro','villain-intro','heroine-intro','hero-villain','hero-heroine','villain-heroine','hanuman-sena','emotional','action-climax']) {
    assert.match(publicWorkspace, new RegExp('data-rt-scene="' + scene + '"'));
    assert.ok(studio.includes("'" + scene + "'"), 'Missing scene genre mapping: ' + scene);
  }
  assert.match(publicWorkspace, /RAMA: THE VARSHAM SAGA/);
});

test('All requested genre folders are present and have curated downloadable collections', () => {
  for (const genre of ['action','romance','thriller','emotional','horror','comedy','devotional','epic','adventure']) {
    assert.match(publicWorkspace, new RegExp('data-rt-genre="' + genre + '"'));
    assert.ok(studio.includes(genre + ':{title:'), 'Missing curated genre: ' + genre);
  }
  assert.match(studio, /Download audio/);
  assert.match(studio, /mixkit\.co\/free-stock-music/);
  assert.ok(publicWorkspace.includes('https://www.youtube.com/audiolibrary'));
});

test('Trailer Studio is independent from My Drive and has no audio preview/player dependency', () => {
  assert.doesNotMatch(studio, /\/api\/my-drive|data-rt-open-my-drive|querySelectorAll\('audio'\)|<audio/);
  const section = publicWorkspace.slice(publicWorkspace.indexOf('id="ramayanamStudio"'), publicWorkspace.indexOf('id="cinematic-sfx"'));
  assert.doesNotMatch(section, /my-drive|My Drive|<audio|audio controls/i);
  assert.match(studio, /Download audio/);
});

test('My Drive, Cinematic Sounds and Cinematic Fonts workspace panels remain present', () => {
  for (const marker of ['id="myDrivePanel"','id="cinematic-sfx"','id="cinematic-fonts"','id="myDriveLoginForm"']) {
    assert.ok(publicWorkspace.includes(marker), 'Missing existing workspace element: ' + marker);
  }
});

test('Genre and scene selection render downloadable source links without inventing hosted audio files', () => {
  assert.match(studio, /function renderGenre/);
  assert.match(studio, /function renderScene/);
  assert.match(studio, /target="_blank" rel="noopener noreferrer"/);
  assert.match(studio, /Downloadable picks|downloadable picks/i);
  assert.doesNotMatch(studio, /blob:|data:audio|\/assets\/.*\.mp3/);
});

test('Trailer Studio layout remains responsive on mobile', () => {
  assert.ok(publicWorkspace.includes('#ramayanamStudio .rt-scene-grid{display:grid'));
  assert.ok(publicWorkspace.includes('#ramayanamStudio .rt-genre-grid{display:grid'));
  assert.ok(publicWorkspace.includes('@media(max-width:420px){#ramayanamStudio .rt-scene-grid'));
});

test('Isolated preview bug reporter retains annotation and export tools', () => {
  const reporter = readFileSync(new URL('../public/ramayanam-bug-reporter.js', import.meta.url), 'utf8');
  for (const feature of ['Select element','Circle area','Highlight area','Draw arrow','Drop marker','Copy report','Download JSON']) assert.ok(reporter.includes(feature));
  assert.ok(publicWorkspace.includes('ramayanam-bug-reporter.js'));
  assert.ok(publicWorkspace.includes('#map132BugPanel'));
});