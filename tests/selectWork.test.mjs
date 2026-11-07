import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Select Work presents the six clear service categories', () => {
  for (const label of ['Cinematic Trailers','Wedding / B’Day','Advertisements','AI Services','Insta Reels','YouTube Related']) {
    assert.ok(home.includes("id: '" + label + "'"), label + ' category should be present');
  }
  assert.match(home, /Choose your <em>work\.<\/em>/);
});

test('Select Work filters existing portfolio projects and preserves All Projects', () => {
  for (const category of ['Cinematic Films','Wedding & Celebrations','Reels & Shorts','YouTube & Podcasts','Brand Promotions','AI Video Creation']) {
    assert.ok(home.includes("'" + category + "'") || home.includes('"' + category + '"') || home.includes(category), category + ' should remain supported by existing portfolio data');
  }
  assert.match(home, /activeProjectCategory === 'All Projects'/);
  assert.match(home, /setActiveProjectCategory\('All Projects'\)/);
  assert.match(home, /category\.pattern\.test\(item\.category\)/);
});

test('Select Work cards have responsive, keyboard-visible styling', () => {
  assert.match(css, /\.work-category-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:950px\)\{\.work-category-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.work-category-card:focus-visible/);
});

test('Select Work does not render a redundant All Selected Projects results heading', () => {
  assert.doesNotMatch(home, /work-results-heading|ALL SELECTED PROJECTS/);
  assert.match(home, /selectedWorkItems\.map\(item =>/);
  assert.match(home, /setActiveProjectCategory\('All Projects'\)/);
});


test('Selected Work does not repeat the separate demo video showcase', () => {
  assert.doesNotMatch(home, /import DemoShowcase/);
  assert.doesNotMatch(home, /<DemoShowcase\b/);
  assert.doesNotMatch(home, /function demoClipTheme/);
});
