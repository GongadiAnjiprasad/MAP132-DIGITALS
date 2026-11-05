import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = fs.readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publicCopy = fs.readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const worker = fs.readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');

test('Workspace public and root HTML copies stay identical', () => {
  assert.equal(publicCopy, root);
});

test('Workspace inline JavaScript parses without executing browser code', () => {
  const scripts = [...root.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});

test('Creative library keeps its own storage key and does not clear browser storage', () => {
  assert.match(root, /const STORE='map132_creative_library_v1'/);
  assert.doesNotMatch(root, /localStorage\.(?:clear|removeItem)\s*\(/);
  assert.match(root, /map132_workspace_resources_v1/);
});

test('Pixabay API secret is server-side and API responses are cached for 24 hours', () => {
  assert.match(worker, /PIXABAY_API_KEY\?: string/);
  assert.match(worker, /expirationTtl:86400/);
  assert.match(worker, /https:\/\/pixabay\.com\/api\/videos\//);
  assert.match(worker, /https:\/\/pixabay\.com\/api\//);
  assert.match(root, /fetch\('\/api\/resources\/pixabay/);
  assert.doesNotMatch(root, /[?&]key=[A-Za-z0-9]{16,}/);
});
