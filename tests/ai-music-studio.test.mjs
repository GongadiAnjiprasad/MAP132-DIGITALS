import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const rootWorkspace = read('../workspace.html');
const publicWorkspace = read('../public/workspace.html');
const studio = read('../public/ai-music-studio.js');
const worker = read('../worker/index.ts');

test('AI Music Studio is available as a fourth Editor Workspace resource panel', () => {
  assert.equal(rootWorkspace, publicWorkspace);
  assert.match(rootWorkspace, /data-resource-view="music"/);
  assert.match(rootWorkspace, /data-resource-panel="music"/);
  assert.match(rootWorkspace, /id="musicGenerateForm"/);
  assert.match(rootWorkspace, /id="musicDuration"/);
  assert.match(rootWorkspace, /id="musicCustomDuration"/);
  assert.match(rootWorkspace, /id="musicFormat"/);
});

test('duration and export controls include the Premiere Pro WAV mix target', () => {
  assert.match(rootWorkspace, /value="105" selected>1 minute 45 seconds/);
  assert.match(rootWorkspace, /min="10" max="600"/);
  assert.match(rootWorkspace, /WAV 48 kHz \/ 24-bit/);
  assert.match(studio, /const sampleRate=48000/);
  assert.match(studio, /view\.setUint16\(34,24,true\)/);
  assert.match(studio, /audio\/wav/);
});

test('music generation is never represented as available until a provider is configured', () => {
  assert.match(rootWorkspace, /id="musicGenerateButton" type="submit" disabled/);
  assert.match(worker, /path==='\/api\/music\/config'/);
  assert.match(worker, /configured:!!env\.ACE_STEP_API_URL/);
  assert.match(studio, /Provider setup required/);
});

test('music provider credentials remain server-side and provider URLs must use HTTPS', () => {
  assert.match(worker, /ACE_STEP_API_KEY/);
  assert.match(worker, /base\.protocol!=='https:'/);
  assert.doesNotMatch(studio, /ACE_STEP_API_KEY|Bearer\s+\+|hf_[A-Za-z0-9]/);
});

test('generation validates prompt, duration and provider-supported output formats', () => {
  assert.match(worker, /duration<10\|\|duration>600/);
  assert.match(worker, /\['wav','mp3','aac'\]/);
  assert.match(worker, /audio_duration:duration/);
  assert.match(worker, /audio_format:format/);
});

test('browser mixer supports optional SFX, volume controls, fades and PCM WAV export', () => {
  for (const id of ['musicSfxFile','musicMainVolume','musicSfxVolume','musicFadeIn','musicFadeOut','musicExportMix']) {
    assert.ok(rootWorkspace.includes('id="'+id+'"'), 'Missing '+id);
  }
  assert.match(studio, /offline\.createGain\(\)/);
  assert.match(studio, /musicGain\.gain\.linearRampToValueAtTime/);
  assert.match(studio, /encodeWav24/);
});
