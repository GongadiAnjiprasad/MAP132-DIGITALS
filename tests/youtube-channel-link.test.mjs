import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const channel = 'https://youtube.com/@map132digitals?si=4tSF4nERwaC-mf7k';

test('MAP132 YouTube channel is the default social destination', () => {
  assert.ok(app.includes("youtube: '" + channel + "'"), 'admin profile defaults must include the supplied channel URL');
  assert.ok(home.includes("p.youtube || '" + channel + "'"), 'public contact links must use the channel when no custom URL is stored');
});

test('admin profile preserves the channel when stored YouTube URL is empty', () => {
  assert.ok(app.includes("youtube:(incoming.profile?.youtube||'').trim()||defaults.profile.youtube"));
});
