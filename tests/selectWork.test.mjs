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
  assert.ok(home.includes('Choose your <em>work.</em>'));
});

test('Selected Work starts with the category chooser, not an automatic all-project gallery', () => {
  assert.ok(home.includes('useState<string | null>(null)'));
  assert.ok(home.includes('activeProjectCategory === null ? [] : content.items.filter'));
  assert.ok(home.includes('activeProjectCategory === null && <div className="ms-work-prompt"'));
  assert.ok(home.includes('selectedWorkShowcaseItem && <section ref={selectedWorkShowcaseRef}'));
  assert.ok(!home.includes('const allProjects = content.items.length > 0 ? content.items : sampleProjects'));
});

test('Category selection scrolls to its matching showcase and offers a return to the chooser', () => {
  assert.ok(home.includes('page.scrollTo({ top: Math.max(0, top), behavior })'));
  assert.ok(home.includes('Change category'));
  assert.ok(home.includes('setActiveProjectCategory(null)'));
  assert.ok(home.includes('aria-pressed={activeProjectCategory === category.id}'));
});

test('All Projects appears only as an explicit choice and shows only published projects', () => {
  assert.ok(home.includes("setActiveProjectCategory('All Projects')"));
  assert.ok(home.includes('const selectedWorkGalleryItems = selectedWorkItems.slice'));
  assert.ok(home.includes('const count = content.items.filter'));
  assert.ok(!home.includes('content.items.length === 0 && <div className="ms-sample-banner"'));
});

test('AI category matching does not match unrelated words containing ai', () => {
  assert.ok(home.includes('pattern: /\\bai\\b|artificial|futur/i'));
});

test('Selected Work does not render a redundant All Selected Projects heading or duplicate showcase', () => {
  assert.ok(!/work-results-heading|ALL SELECTED PROJECTS|import DemoShowcase|<DemoShowcase\\b/.test(home));
  assert.ok(home.includes('selectedWorkGalleryItems.map(item =>'));
});

test('Category visual preview remains responsive and accessible', () => {
  assert.ok(homeCss.includes('.ms-category-showcase{display:grid'));
  assert.ok(homeCss.includes('.ms-work-prompt{display:flex'));
  assert.ok(homeCss.includes('.ms-category-back:focus-visible'));
  assert.ok(homeCss.includes('@media(max-width:760px){.ms-work-prompt'));
  assert.ok(css.includes('.work-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'));
  assert.ok(css.includes('.work-category-card:focus-visible'));
});
