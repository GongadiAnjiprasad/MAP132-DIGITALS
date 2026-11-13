import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('shared MAP132 design tokens are defined for colour, typography, controls and surfaces', () => {
  const css = read('../src/design-system.css');
  for (const token of [
    '--map132-font-body', '--map132-font-display', '--map132-bg',
    '--map132-surface', '--map132-accent', '--map132-text',
    '--map132-muted', '--map132-border', '--map132-radius-control',
    '--map132-radius-input', '--map132-radius-card', '--map132-control-height',
  ]) assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('shared design system is loaded after the existing public theme layers', () => {
  const main = read('../src/main.tsx');
  const imports = [
    "import './HomeSlider.css';",
    "import './HomeSliderPremium.css';",
    "import './HomeSliderLightPremium.css';",
    "import './design-system.css';",
  ];
  let previous = -1;
  for (const entry of imports) {
    const index = main.indexOf(entry);
    assert.ok(index > previous, entry + ' should follow the previous style layer');
    previous = index;
  }
});

test('creator workspace shares the public typography and accent tokens', () => {
  const workspace = read('../public/workspace.html');
  assert.match(workspace, /--gold:var\(--map132-accent\)/);
  assert.match(workspace, /--map132-font-body:"DM Sans"/);
  assert.match(workspace, /--map132-font-display:"Manrope"/);
  assert.match(workspace, /family=DM\+Sans/);
  assert.match(workspace, /family=Manrope/);
  assert.match(workspace, /MAP132 shared design system — workspace alignment/);
});

test('root and deployed workspace documents remain synchronized', () => {
  assert.equal(read('../workspace.html'), read('../public/workspace.html'));
});
