import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/modules/seasonal/festival-frames.css', import.meta.url), 'utf8');

test('pre-festival ambience remains visible without taking over the site', () => {
  assert.match(css, /pointer-events:\s*none;\s*opacity:\s*\.48/);
  assert.match(css, /font-size:\s*clamp\(16px,\s*2\.4vw,\s*30px\)/);
  assert.match(css, /12%\s*\{\s*opacity:\s*\.88;\s*\}/);
  assert.match(css, /88%\s*\{\s*opacity:\s*\.72;\s*\}/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('festival greeting stays click-through and keeps its dismiss control in the original top corner while the greeting stays click-through', () => {
  assert.match(css, /\.ff-greeting\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.ff-greeting-close\s*\{[^}]*top:\s*12px;\s*left:\s*12px/);
  assert.match(css, /\.ff-greeting-close\s*\{[^}]*pointer-events:\s*auto/s);
});
