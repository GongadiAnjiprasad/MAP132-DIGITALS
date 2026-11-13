import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootWorkspace = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publicWorkspace = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../public/ramayanam-trailer-studio.js', import.meta.url), 'utf8');

test('Ramayanam Audio Library is a separate Editor Workspace tab and workspace mirrors match', () => {
  assert.equal(rootWorkspace, publicWorkspace);
  assert.match(publicWorkspace, /data-resource-view="trailer"/);
  assert.match(publicWorkspace, /data-resource-panel="trailer"/);
  assert.match(publicWorkspace, /ramayanam-trailer-studio\.js/);
});

test('All nine character-combination scene categories and six mood filters are available', () => {
  for (const category of ['hero-intro','villain-intro','heroine-intro','hero-villain','hero-heroine','villain-heroine','hanuman-sena','emotional','action-climax']) {
    assert.match(publicWorkspace, new RegExp('data-library-cat="' + category + '"'));
  }
  for (const mood of ['mass','royal','emotional','devotional','suspense','action']) {
    assert.match(publicWorkspace, new RegExp('data-library-mood="' + mood + '"'));
  }
});

test('Library loads actual private Drive audio, supports preview/download and single-active playback', () => {
  assert.match(studio, /\/api\/my-drive\/assets\?limit=100/);
  assert.match(studio, /\/api\/my-drive\/assets\//);
  assert.match(studio, /querySelectorAll\('audio'\)\.forEach\(a=>a\.addEventListener\('play'/);
  assert.match(studio, /data-rt-open-my-drive/);
  assert.match(publicWorkspace, /id="rtLibraryRefresh"/);
});

test('My Drive, Cinematic Sounds and Cinematic Fonts workspace panels are preserved', () => {
  for (const marker of ['id="myDrivePanel"','id="cinematic-sfx"','id="cinematic-fonts"','id="myDriveLoginForm"','id="myDriveChooseZip"']) {
    assert.ok(publicWorkspace.includes(marker), 'Missing preserved workspace element: ' + marker);
  }
});

test('Scene guide stays visible even when no Drive audio has been connected', () => {
  for (const marker of ['90-second scene guide','Hero introduction','Villain introduction','Heroine introduction','Hero vs Villain','Hero vs Heroine','Villain controls Heroine','Hanuman Sena','Emotional / Separation','Action / Climax']) {
    assert.ok(publicWorkspace.includes(marker), 'Missing scene guide content: ' + marker);
  }
  assert.match(studio, /No audio files are connected to this library yet/);
  assert.match(studio, /Open My Drive to add audio/);
});

test('Trailer Studio layout prevents grid and long-label overflow on mobile', () => {
  assert.match(publicWorkspace, /\.rt-studio,\.rt-studio \*\{box-sizing:border-box;min-width:0\}/);
  assert.match(publicWorkspace, /grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,150px\),1fr\)\)/);
  assert.match(publicWorkspace, /@media\(max-width:420px\)\{\.rt-guide-grid\{grid-template-columns:minmax\(0,1fr\)\}\}/);
  assert.match(publicWorkspace, /\.rt-audio-card audio\{width:100%;max-width:100%/);
});

test('No text dialogue, copy, or manual SFX search controls remain in Ramayanam library', () => {
  const section = publicWorkspace.slice(publicWorkspace.indexOf('id="ramayanamStudio"'), publicWorkspace.indexOf('id="cinematic-sfx"'));
  assert.doesNotMatch(section, /data-rt-tab="dialogue"|data-copy-dialogue|rtSfxForm|Find sound effects|Copy dialogue/i);
});
