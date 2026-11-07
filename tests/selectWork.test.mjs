import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const homeCss = readFileSync(new URL('../src/HomeSlider.css', import.meta.url), 'utf8');

test('Selected Work keeps all six category tabs available on the same page', () => {
  for (const label of ['Cinematic Trailers','Wedding / B’Day','Advertisements','AI Services','Insta Reels','YouTube Related']) {
    assert.ok(home.includes("id: '" + label + "'"), label + ' category should be present');
  }
  assert.ok(home.includes('work-category-tabs'));
  assert.ok(home.includes('aria-label="Choose a project category"'));
  assert.ok(homeCss.includes('.ms-work-page .work-category-tabs'));
  assert.ok(homeCss.includes('position:sticky'));
});

test('Selecting a category filters the real project data without a separate showcase jump', () => {
  assert.ok(home.includes('const selectedWorkItems = activeProjectCategory === null ? [] : content.items.filter'));
  assert.ok(home.includes('onClick={() => selectWorkCategory(category.id)}'));
  assert.ok(home.includes('onClick={() => selectWorkCategory(\'All Projects\')}'));
  assert.ok(!home.includes('selectedWorkShowcaseRef'));
  assert.ok(!home.includes('selectedWorkShowcaseItem'));
  assert.ok(!home.includes('sampleProjects'));
});

test('The gallery displays every matching project across pages without duplicating a featured item', () => {
  assert.ok(home.includes('const projectsPerPage = 6'));
  assert.ok(home.includes('const selectedWorkPageCount = Math.max(1, Math.ceil(selectedWorkItems.length / projectsPerPage))'));
  assert.ok(home.includes('const paginatedWorkItems = selectedWorkItems.slice'));
  assert.ok(home.includes('paginatedWorkItems.map(item =>'));
  assert.ok(home.includes('selectedWorkItems.length > projectsPerPage'));
  assert.ok(home.includes('Page {activeProjectPage} of {selectedWorkPageCount}'));
  assert.ok(homeCss.includes('.ms-work-pagination'));
});

test('Changing category resets pagination and All Projects remains an explicit choice', () => {
  assert.ok(home.includes('const selectWorkCategory = (category: string) => { setActiveProjectCategory(category); setActiveProjectPage(1); }'));
  assert.ok(home.includes('aria-pressed={activeProjectCategory === category.id}'));
  assert.ok(home.includes('aria-pressed={activeProjectCategory === \'All Projects\'}'));
});

test('Empty categories are clearly labelled without inventing sample client projects', () => {
  assert.ok(home.includes('No published projects in this category yet'));
  assert.ok(home.includes('Add matching projects through the workspace'));
  assert.ok(!home.includes('Reference moodboard only'));
});

test('Category tabs and pagination remain usable on mobile and respect reduced motion', () => {
  assert.ok(homeCss.includes('@media(max-width:760px)'));
  assert.ok(homeCss.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(home.includes('aria-label="Project gallery pages"'));
});


test('All six category choices are arranged in a three-column, two-row grid', () => {
  assert.ok(homeCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'));
  assert.ok(homeCss.includes('.ms-work-page .work-category-tabs'));
  assert.ok(homeCss.includes('overflow: visible'));
});
