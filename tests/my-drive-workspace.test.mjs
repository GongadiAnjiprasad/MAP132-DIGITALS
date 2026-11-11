import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootHtml = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publishedHtml = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/my-drive-resource-manager.js', import.meta.url), 'utf8');

test('My Drive is a separate workspace tab and its browser script is loaded', () => {
  assert.match(rootHtml, /data-resource-view="my-drive"/);
  assert.match(rootHtml, /data-resource-panel="my-drive"/);
  assert.match(rootHtml, /id="myDrivePanel"/);
  assert.match(rootHtml, /my-drive-resource-manager\\.js/);
  assert.match(source, /panel\.dataset\.initialized/);
  assert.doesNotThrow(() => new Function(source));
});

test('My Drive setup and unlock forms call the protected server-side lock APIs', () => {
  assert.match(source, /api\\/my-drive\\/lock\\/status/);
  assert.match(source, /api\\/my-drive\\/lock\\/setup/);
  assert.match(source, /api\\/my-drive\\/lock\\/unlock/);
  assert.match(source, /Admin Dashboard sign-in/);
  assert.match(source, /index\.html#admin/);
});

test('Google Drive folder import and ZIP font import use persistent asset APIs', () => {
  assert.match(source, /api\\/my-drive\\/oauth\\/start/);
  assert.match(source, /api\\/my-drive\\/picker-config/);
  assert.match(source, /api\\/my-drive\\/import-folder/);
  assert.match(source, /api\\/my-drive\\/assets/);
  assert.match(source, /ttf.*otf.*woff.*woff2/);
  assert.match(source, /DecompressionStream/);
  assert.match(source, /crc32/);
  assert.match(source, /MAP132 DIGITALS Resources/);
  assert.doesNotMatch(source, /api\\/my-drive\\/files(?:[?'"]|$)/);
  assert.doesNotMatch(source, /api\\/my-drive\\/download\\//);
});

test('My Drive script never stores passwords or OAuth tokens in browser storage', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /credentials: 'same-origin'/);
});

test('root and published workspace pages remain byte-for-byte synchronized', () => {
  assert.equal(rootHtml, publishedHtml);
  assert.match(rootHtml, /copied into your Google Drive folder/);
  assert.match(rootHtml, /id="myDriveRefresh"/);
});
