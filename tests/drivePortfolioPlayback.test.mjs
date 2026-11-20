import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
const oauth = readFileSync(new URL('../src/modules/my-drive-resource-manager/driveOAuth.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/HomeSlider.tsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const moduleUi = readFileSync(new URL('../src/modules/drive-portfolio/DrivePortfolioSync.tsx', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

test('Drive video playback is restricted to items published in portfolio content', () => {
  assert.ok(worker.includes("item.kind==='video'&&item.source==='drive'&&item.driveFileId===fileId&&typeof item.driveFolderId==='string'"));
  assert.ok(worker.includes("if(!published)return json({error:'This video is not published in the MAP132 portfolio.'},404)"));
  assert.ok(worker.includes("startsWith('video/')"));
});

test('published Drive playback forwards byte-range requests for browser seeking', () => {
  assert.ok(worker.includes("const range=req.headers.get('Range')"));
  assert.ok(worker.includes('upstreamHeaders.Range=range'));
  assert.ok(worker.includes("'Content-Range'"));
  assert.ok(worker.includes("'Accept-Ranges'"));
});

test('public playback uses the encrypted OAuth refresh token and caches short-lived access tokens', () => {
  assert.ok(oauth.includes('export async function getPublishedDriveAccessToken'));
  assert.ok(oauth.includes("await env.MAP132_KV.get(REFRESH_TOKEN_KEY)"));
  assert.ok(oauth.includes("await decrypt<{ refresh_token: string }>(encryptedRefresh, env.MY_DRIVE_SESSION_SECRET)"));
  assert.ok(oauth.includes("const cacheKey = 'my-drive/published-access-token'"));
  assert.ok(oauth.includes("await encrypt({ access_token: token.access_token, expires_at: expiresAt }"));
});

test('Selected Work uses the same-origin stream instead of exposing private Drive preview links', () => {
  assert.ok(home.includes("'/api/portfolio/video/' + encodeURIComponent(item.driveFileId)"));
  assert.ok(home.includes("if (item.kind === 'video' && src) return <video"));
  assert.ok(admin.includes("'/api/portfolio/video/' + encodeURIComponent(item.driveFileId)"));
});

test('Admin Drive sync has on-demand and scheduled 15-minute refresh and warns about public publishing', () => {
  assert.ok(moduleUi.includes('listDriveFolderRecursively'));
  assert.ok(moduleUi.includes('buildDrivePortfolioItems'));
  assert.ok(moduleUi.includes("fetch('/api/my-drive/portfolio-folder'"));
  assert.ok(moduleUi.includes('Sync now'));
  assert.ok(!moduleUi.includes("addEventListener('focus'"));
  assert.ok(worker.includes("import { syncDrivePortfolioFromFolder } from './drivePortfolioCron'"));
  assert.ok(worker.includes("if(controller.cron==='*/15 * * * *')"));
  assert.ok(wrangler.includes('crons = ["35 18 * * *", "*/15 * * * *"]'));
  assert.ok(worker.includes("if(controller.cron!=='35 18 * * *')return"));
  assert.ok(oauth.includes("path === '/api/my-drive/portfolio-folder' && request.method === 'PUT'"));
  assert.ok(moduleUi.includes('Source Drive files are not changed.'));
  assert.ok(moduleUi.includes('Every supported video found in this selected folder becomes publicly playable'));
});

test('sync replaces only the selected folder records and keeps unrelated portfolio entries', () => {
  assert.ok(admin.includes('content.items.filter(item=>item.driveFolderId!==folderId)'));
});
