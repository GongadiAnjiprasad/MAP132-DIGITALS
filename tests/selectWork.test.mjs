import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Select Work presents the six clear service categories', () => {
  for (const label of ['Cinematic Trailers','Wedding / B’Day','Advertisements','AI Services','Insta Reels','YouTube Related']) {
    assert.ok(app.includes("id:'" + label + "'"), label + ' category should be present');
  }
  assert.match(app, /Choose your <em>work\.<\/em>/);
});

test('Select Work maps the six cards to existing portfolio upload categories', () => {
  for (const category of ['Cinematic Films','Wedding & Events','Birthday Films','Brand Promotions','AI Video Creation','Reels & Shorts','YouTube Videos']) {
    assert.ok(app.includes("'" + category + "'"), category + ' should remain supported');
  }
  assert.match(app, /activeWorkCategory === 'All Projects'/);
  assert.match(app, /setActiveWorkCategory\('All Projects'\)/);
});

test('Select Work cards have responsive, keyboard-visible styling', () => {
  assert.match(css, /\.work-category-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:950px\)\{\.work-category-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.work-category-card:focus-visible/);
});
