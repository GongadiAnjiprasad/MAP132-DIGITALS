import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const homeCss = readFileSync(new URL('../src/HomeSlider.css', import.meta.url), 'utf8');

test('Select Work presents the six clear service categories', () => {
  for (const label of ['Cinematic Trailers','Wedding / B’Day','Advertisements','AI Services','Insta Reels','YouTube Related']) {
    assert.ok(home.includes("id: '" + label + "'"), label + ' category should be present');
  }
  assert.match(home, /Choose your <em>work\\.<\\/em>/);
});

test('Selected Work starts with the category chooser, not an automatic all-project gallery', () => {
  assert.match(home, /useState<string \\| null>\\(null\\)/);
  assert.match(home, /activeProjectCategory === null \? \[\] : content\\.items\\.filter/);
  assert.match(home, /activeProjectCategory === null && <div className="ms-work-prompt"/);
  assert.match(home, /selectedWorkShowcaseItem && <section ref=\\{selectedWorkShowcaseRef\\}/);
  assert.doesNotMatch(home, /const allProjects = content\\.items\\.length > 0 \? content\\.items : sampleProjects/);
});

test('Category selection scrolls to its matching showcase and offers a return to the chooser', () => {
  assert.match(home, /page\\.scrollTo\\(\\{ top: Math\\.max\\(0, top\\), behavior \\}\\)/);
  assert.match(home, /Change category/);
  assert.match(home, /setActiveProjectCategory\\(null\\)/);
  assert.match(home, /aria-pressed=\\{activeProjectCategory === category\\.id\\}/);
});

test('All Projects appears only as an explicit choice and shows only published projects', () => {
  assert.match(home, /setActiveProjectCategory\\('All Projects'\\)/);
  assert.match(home, /const selectedWorkGalleryItems = selectedWorkItems\\.slice/);
  assert.match(home, /const count = content\\.items\\.filter/);
  assert.doesNotMatch(home, /content\\.items\\.length === 0 && <div className="ms-sample-banner"/);
});

test('AI category matching does not match unrelated words containing ai', () => {
  assert.match(home, /pattern: \/\\\\bai\\\\b\\|artificial\\|futur\/i/);
});

test('Selected Work does not render a redundant All Selected Projects heading or duplicate showcase', () => {
  assert.doesNotMatch(home, /work-results-heading|ALL SELECTED PROJECTS|import DemoShowcase|<DemoShowcase\\b/);
  assert.match(home, /selectedWorkGalleryItems\\.map\\(item =>/);
});

test('Category visual preview remains responsive and accessible', () => {
  assert.match(homeCss, /\\.ms-category-showcase\\{display:grid/);
  assert.match(homeCss, /\\.ms-work-prompt\\{display:flex/);
  assert.match(homeCss, /\\.ms-category-back:focus-visible/);
  assert.match(homeCss, /@media\\(max-width:760px\\)\\{\\.ms-work-prompt/);
  assert.match(css, /\\.work-category-grid\\{display:grid;grid-template-columns:repeat\\(3,minmax\\(0,1fr\\)\\)/);
  assert.match(css, /\\.work-category-card:focus-visible/);
});
