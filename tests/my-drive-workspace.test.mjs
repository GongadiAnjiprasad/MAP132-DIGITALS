import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('My Drive resource library is a separate workspace tab and panel', () => {
  const html = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
  assert.match(html, /data-resource-view="my-drive"/);
  assert.match(html, /data-resource-panel="my-drive"/);
  assert.match(html, /id="myDrivePanel"/);
  assert.match(html, /my-drive-resource-manager\.js/);
});

test('My Drive browser script parses and does not persist Drive tokens or password text', () => {
  const source = readFileSync(new URL('../public/my-drive-resource-manager.js', import.meta.url), 'utf8');
  assert.doesNotThrow(() => new Function(source));
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /api\/my-drive\/lock\/setup/);
  assert.match(source, /api\/my-drive\/picker-config/);
  assert.match(source, /listPage\(folder\.id,token\)/);
  assert.match(source, /crypto\.subtle\.digest\('SHA-256'/);
});

test('root and public workspace copies stay byte-for-byte synchronized', () => {
  const root = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
  const published = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
  assert.equal(root, published);
});
