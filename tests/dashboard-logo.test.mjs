import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const slider = await readFile(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker/index.ts', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const festival = await readFile(new URL('../src/modules/seasonal/IndianFestivalAtmosphere.tsx', import.meta.url), 'utf8');

const officialLogo = '/resources/Logo.png';

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
  assert.match(worker, /MAP132_KV!\.put\(key,bytes,\{metadata:\{contentType\}\}\)/);
  assert.match(worker, /getWithMetadata\(key,\{type:'arrayBuffer'\}\)/);
  assert.match(worker, /validPng/);
  assert.match(worker, /validJpeg/);
  assert.match(worker, /validWebp/);
});

test('public portfolio API resolves uploaded logos and falls back to the official Logo.png worker asset and uses the PNG brand default', () => {
  assert.match(worker, /content\.logoUrl=content\.logoPath\?/);
  assert.match(worker, /portfolio\/logos\//);
  assert.match(worker, /resources\/Logo\.png/);
  assert.match(app, /const DEFAULT_BRAND_LOGO = '\/resources\/Logo\.png'/);
});

test('the public header uses the official PNG logo and feedback widget uses the configured brand default', () => {
  assert.match(slider, /content\.logoUrl \|\| '\/resources\/Logo\.png'/);
  assert.match(app, /FeedbackWidget\(\{ logoUrl = DEFAULT_BRAND_LOGO \}/);
  assert.match(app, /logoUrl=\{content\.logoUrl\|\|DEFAULT_BRAND_LOGO\}/);
  assert.match(app, /const logoUrl = content\.logoUrl \|\| DEFAULT_BRAND_LOGO/);
  assert.match(festival, /src=\{logoUrl\} alt="MAP132 DIGITALS"/);
  assert.ok(app.includes(officialLogo));
});

test('the official Logo.png logo is used for browser icons and social metadata', () => {
  assert.match(app, /const absoluteLogo=new URL\(content\.logoUrl\|\|DEFAULT_BRAND_LOGO,window\.location\.origin\)\.href/);
  assert.match(app, /icon\.href=content\.logoUrl\|\|DEFAULT_BRAND_LOGO/);
  assert.match(app, /apple\.href=absoluteLogo/);
  assert.match(app, /item\.logo=\{'@type':'ImageObject',url:absoluteLogo\}/);
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/);
});
