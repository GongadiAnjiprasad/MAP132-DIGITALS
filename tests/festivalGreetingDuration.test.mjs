import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/modules/seasonal/IndianFestivalAtmosphere.tsx', import.meta.url), 'utf8');

test('festival greeting automatically closes after eight seconds and clears its timer', () => {
  assert.match(component, /window\.setTimeout\(\(\) => setDismissed\(true\), 8_000\)/);
  assert.match(component, /window\.clearTimeout\(autoCloseTimer\)/);
  assert.match(component, /onClick=\{\(\) => setDismissed\(true\)\}/);
});
