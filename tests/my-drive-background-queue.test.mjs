import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyMyDriveQueueResource } from '../worker/myDriveQueue.ts';

const queue = readFileSync(new URL('../worker/myDriveQueue.ts', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const config = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../public/my-drive-resource-manager.js', import.meta.url), 'utf8');

test('background queue classifies supported creative assets into the existing libraries', () => {
  assert.equal(classifyMyDriveQueueResource('suranna_bold.otf', 'Fonts/suranna_bold.otf'), 'Fonts');
  assert.equal(classifyMyDriveQueueResource('cinematic_whoosh.wav', 'Sound Effects/cinematic_whoosh.wav'), 'Sound Effects');
  assert.equal(classifyMyDriveQueueResource('wedding_highlight.mp4', 'Wedding/wedding_highlight.mp4'), 'Wedding');
  assert.equal(classifyMyDriveQueueResource('archive.zip', 'Editing/archive.zip'), 'Plugins');
  assert.equal(classifyMyDriveQueueResource('notes.txt', 'Editing/notes.txt'), null);
});

test('background copies are queued in persistent KV and copied directly inside Google Drive', () => {
  assert.ok(queue.includes("PREFIX+'jobs/'"));
  assert.ok(queue.includes("PREFIX+'items/'"));
  assert.ok(queue.includes("files/'+encodeURIComponent(item.sourceFileId)+'/copy"));
  assert.ok(!queue.includes("'/api/my-drive/queue/cancel'"));
  assert.ok(queue.includes("PREFIX+'source-copy/'"));
  assert.ok(queue.includes("appProperties has"));
  assert.ok(queue.includes("item.status='completed';item.progress=100"));
  assert.ok(queue.includes("item.attempts>=5?'failed':'queued'"));
  assert.ok(queue.includes('Google Drive background authorization needs reconnecting.'));
});

test('Worker cron continues queue processing without an open Workspace browser', () => {
  assert.ok(worker.includes('processMyDriveQueue(env)'));
  assert.ok(worker.includes('handleMyDriveQueue(req,env)'));
  assert.match(config, /crons\s*=\s*\["\* \* \* \* \*"\]/);
});

test('My Drive renders a compact internal-scroll queue and starts it from selected Drive folders', () => {
  assert.ok(ui.includes('My Drive · Download Queue'));
  assert.ok(ui.includes('max-height:172px;overflow-y:auto'));
  assert.ok(ui.includes("post('/api/my-drive/queue'"));
  assert.ok(ui.includes('window.setInterval'));
  assert.ok(ui.includes('queuePanel.hidden = false'));
  assert.ok(ui.includes("file.name.toLowerCase().endsWith('.zip')"));
});
