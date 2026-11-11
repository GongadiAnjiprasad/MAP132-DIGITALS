import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootHtml = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publishedHtml = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/my-drive-resource-manager.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('My Drive is a separate workspace tab and its browser script is loaded', () => {
  assert.ok(rootHtml.includes('data-resource-view="my-drive"'));
  assert.ok(rootHtml.includes('data-resource-panel="my-drive"'));
  assert.ok(rootHtml.includes('id="myDrivePanel"'));
  assert.ok(rootHtml.includes('my-drive-resource-manager.js'));
  assert.ok(source.includes("panel.dataset.initialized"));
  assert.doesNotThrow(() => new Function(source));
});

test('The main Editor Workspace route opens the persistent Google Drive workspace', () => {
  assert.ok(appSource.includes("window.location.replace('/workspace.html')"));
  assert.ok(appSource.includes('href="/workspace.html"><Film size={14}/> Editor Workspace'));
});

test('My Drive password forms include accessible show and hide controls', () => {
  for (const id of ['myDriveSetupToggle', 'myDriveUnlockToggle']) {
    assert.ok(rootHtml.includes('id="' + id + '"'));
  }
  assert.ok(source.includes('bindPasswordVisibility'));
  assert.ok(source.includes("input.type = visible ? 'text' : 'password'"));
  assert.ok(source.includes("button.setAttribute('aria-pressed', String(visible))"));
});

test('My Drive setup and unlock forms call the protected server-side lock APIs', () => {
  for (const route of ['/api/my-drive/lock/status', '/api/my-drive/lock/setup', '/api/my-drive/lock/unlock']) {
    assert.ok(source.includes(route), 'Missing route: ' + route);
  }
  assert.ok(source.includes('Admin Dashboard sign-in'));
  assert.ok(source.includes('index.html#admin'));
});

test('Google Drive folder import and ZIP font import use persistent asset APIs', () => {
  for (const route of ['/api/my-drive/oauth/start', '/api/my-drive/picker-config', '/api/my-drive/import-folder', '/api/my-drive/assets']) {
    assert.ok(source.includes(route), 'Missing route: ' + route);
  }
  assert.match(source, /ttf.*otf.*woff.*woff2/);
  assert.ok(source.includes('DecompressionStream'));
  assert.ok(source.includes('crc32'));
  assert.ok(source.includes('MAP132 DIGITALS Resources'));
  assert.ok(!source.includes('/api/my-drive/files'));
  assert.ok(!source.includes('/api/my-drive/download/'));
});

test('My Drive script never stores passwords or OAuth tokens in browser storage', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.ok(source.includes("credentials: 'same-origin'"));
});

test('root and published workspace pages remain byte-for-byte synchronized', () => {
  assert.equal(rootHtml, publishedHtml);
  assert.ok(rootHtml.includes('copied into your Google Drive folder'));
  assert.ok(rootHtml.includes('id="myDriveRefresh"'));
  assert.ok(rootHtml.includes('myDriveSetupToggle'));
  assert.ok(rootHtml.includes('myDriveUnlockToggle'));
});
