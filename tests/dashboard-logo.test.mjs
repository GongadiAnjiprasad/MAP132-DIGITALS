import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const slider = await readFile(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/index.ts', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('admin dashboard exposes a dedicated website logo manager with preview and restore', () => {
  assert.match(app, /'logo'\|/);
  assert.match(app, /Website Logo/);
  assert.match(app, /logoPreview \|\| content\.logoUrl/);
  assert.match(app, /Restore original logo/);
});

test('logo uploads are restricted to authenticated admin sessions and supported image formats', () => {
  assert.match(worker, /if\(!await validSession\(req,env\)\)/);
  assert.match(worker, /\/api\/admin\/upload-logo/);
  assert.match(worker, /image\/png','image\/jpeg','image\/webp/);
  assert.match(worker, /5\*1024\*1024/);
  assert.match(worker, /portfolio\/logos\//);
  assert.match(worker, /validPng/);
  assert.match(worker, /validJpeg/);
  assert.match(worker, /validWebp/);
});

test('public portfolio API resolves the saved logo from R2 and falls back to the existing myLogo asset', () => {
  assert.match(worker, /content\.logoUrl=content\.logoPath&&env\.MAP132_MEDIA\?/);
  assert.match(worker, /portfolio\/logos\//);
  assert.match(worker, /resources\/MAP%20logo\.png/);
});

test('the public header and feedback widget use the saved logo URL', () => {
  assert.match(slider, /content\.logoUrl \|\| '\/resources\/MAP%20logo\.png'/);
  assert.match(app, /FeedbackWidget\(\{ logoUrl = DEFAULT_BRAND_LOGO \}/);
  assert.match(app, /<FeedbackWidget logoUrl=\{/);
});

test('the saved logo updates the browser icon and organization structured data while the original SVG favicon remains the default', () => {
  assert.match(app, /content\.logoPath\?absoluteLogo:'\/favicon\.svg'/);
  assert.match(app, /item\.logo=\{'@type':'ImageObject',url:absoluteLogo\}/);
  assert.match(html, /href="\/favicon\.svg"/);
});
