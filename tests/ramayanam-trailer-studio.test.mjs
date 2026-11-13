import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootWorkspace = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publicWorkspace = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const studio = readFileSync(new URL('../public/ramayanam-trailer-studio.js', import.meta.url), 'utf8');

test('Ramayanam Trailer Studio is available as a separate Editor Workspace tab', () => {
  assert.equal(rootWorkspace, publicWorkspace, 'workspace source and public mirror must stay identical');
  assert.match(publicWorkspace, /data-resource-view="trailer"/);
  assert.match(publicWorkspace, /data-resource-panel="trailer"/);
  assert.match(publicWorkspace, /ramayanam-trailer-studio\.js/);
});

test('Trailer Studio includes the 90-second scene cue sheet and copyable dialogue library', () => {
  assert.match(studio, /00:00–00:09/);
  assert.match(studio, /01:25–01:30/);
  assert.match(studio, /Bhagavad Gita 4\.7/);
  assert.match(studio, /Bhagavad Gita 4\.8/);
  assert.match(studio, /writeText\(item\.text\)/);
});

test('Trailer Studio uses existing eligible SFX and private Drive audio routes', () => {
  assert.match(studio, /\/api\/resources\/sounds\?query=/);
  assert.match(studio, /\/api\/my-drive\/assets\?limit=100/);
  assert.match(studio, /\/api\/my-drive\/assets\//);
  assert.match(studio, /data-rt-open-my-drive/);
});
