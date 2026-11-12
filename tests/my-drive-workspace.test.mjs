import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootHtml = readFileSync(new URL('../workspace.html', import.meta.url), 'utf8');
const publishedHtml = readFileSync(new URL('../public/workspace.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/my-drive-resource-manager.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

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

test('My Drive uses the Admin Dashboard session with a simple Login and Logout UI', () => {
  assert.ok(rootHtml.includes('id="myDriveLogin"'));
  assert.ok(rootHtml.includes('id="myDriveLogout"'));
  assert.ok(!rootHtml.includes('myDriveSetupForm'));
  assert.ok(!rootHtml.includes('myDriveUnlockForm'));
  assert.ok(!rootHtml.includes('myDriveSetupPassword'));
  assert.ok(!rootHtml.includes('myDriveUnlockPassword'));
  assert.ok(source.includes("request('/api/admin/session')"));
  assert.ok(source.includes("post('/api/admin/logout')"));
  assert.ok(source.includes('async function logout()'));
});

test('My Drive login gate and content are driven by the active admin session', () => {
  assert.ok(source.includes('state.authenticated = Boolean(session.authenticated)'));
  assert.ok(source.includes('gate.hidden = state.authenticated'));
  assert.ok(source.includes('content.hidden = !state.authenticated'));
  assert.ok(rootHtml.includes('Login to Admin Dashboard'));
});

test('Admin dashboard password input has a working show/hide control', () => {
  assert.ok(appSource.includes("type={showPassword?'text':'password'}"));
  assert.ok(appSource.includes("onClick={()=>setShowPassword(v=>!v)}"));
  assert.ok(appSource.includes("aria-label={showPassword?'Hide password':'Show password'}"));
  assert.match(cssSource, /\.login-password-field \.password-visibility\{[^}]*border:0!important/);
});

test('My Drive browser script does not call the removed password lock endpoints', () => {
  assert.doesNotMatch(source, /\/api\/my-drive\/lock/);
  assert.doesNotMatch(source, /myDriveSetup|myDriveUnlock|myDriveLock/);
});

test('Google Drive folder import scans the selected folder and uses category asset APIs', () => {
  for (const route of ['/api/my-drive/oauth/start', '/api/my-drive/picker-config', '/api/my-drive/files', '/api/my-drive/download/', '/api/my-drive/assets']) {
    assert.ok(source.includes(route), 'Missing route: ' + route);
  }
  assert.ok(source.includes('syncSelectedFolder'));
  assert.ok(source.includes('Only the selected folder was scanned.'));
  assert.ok(source.includes('X-Asset-Category'));
  assert.ok(source.includes('Sound Effects'));
  assert.ok(source.includes('Trailer BGMs'));
  assert.ok(source.includes('DecompressionStream'));
  assert.ok(source.includes('crc32'));
  assert.ok(source.includes('MAP132 Workspace'));
  assert.ok(!source.includes('/api/my-drive/import-folder'));
  assert.ok(!source.includes('myDriveDisconnect'));
  assert.ok(!source.includes('myDriveBrowse'));
});

test('My Drive script never stores passwords or OAuth tokens in browser storage', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.ok(source.includes("credentials: 'same-origin'"));
});

test('root and published workspace pages remain byte-for-byte synchronized', () => {
  assert.equal(rootHtml, publishedHtml);
  assert.ok(rootHtml.includes('MAP132 Workspace'));
  assert.ok(rootHtml.includes('Choose one folder from your Google Drive'));
  assert.ok(rootHtml.includes('id="myDriveRefresh"'));
  assert.ok(rootHtml.includes('myDriveLogin'));
  assert.ok(rootHtml.includes('myDriveLogout'));
});

test('My Drive server access is bound to the Admin Dashboard session', () => {
  const oauthSource = readFileSync(new URL('../src/modules/my-drive-resource-manager/driveOAuth.ts', import.meta.url), 'utf8');
  const workerSource = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.ok(oauthSource.includes('async function hasAdminSession'));
  assert.ok(oauthSource.includes('MAP132 Admin login required'));
  assert.ok(workerSource.includes("if(!await validSession(req,env))return json({error:'MAP132 Admin login required."));
  assert.ok(workerSource.includes('clearMyDriveSession(req,env)'));
  assert.doesNotMatch(oauthSource, /my-drive\/lock\/password-hash|map132_drive_unlock/);
});

test('Google OAuth token exchange exposes only a sanitized provider error for diagnosis', async () => {
  const oauthSource = readFileSync(new URL('../src/modules/my-drive-resource-manager/driveOAuth.ts', import.meta.url), 'utf8');
  assert.ok(oauthSource.includes("const providerFailure = await tokenResponse.json().catch(() => ({}))"));
  assert.ok(oauthSource.includes(".replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)"));
  assert.ok(oauthSource.includes(".slice(0, 180)"));
  assert.ok(oauthSource.includes("Google token exchange failed (' + providerError + ')'"));
  assert.doesNotMatch(oauthSource, /console\.(log|error)\(.*(client_secret|refresh_token|code_verifier|access_token)/s);
});


test('active My Drive workspace offers device ZIP selection and recursively imports all supported categories', () => {
  assert.ok(rootHtml.includes('id="myDriveChooseZip"'));
  assert.ok(rootHtml.includes('id="myDriveLocalZip"'));
  assert.ok(rootHtml.includes('accept=".zip,application/zip,application/x-zip-compressed"'));
  assert.ok(source.includes('async function extractZipResources'));
  assert.ok(source.includes('Nested ZIP depth exceeds the safe limit'));
  assert.ok(source.includes('classifyZipResource'));
  assert.ok(source.includes('uploadResource(asset.file,asset.category,asset.path)'));
  assert.ok(source.includes('crc32(outBytes)'));
  assert.ok(rootHtml.includes('saves them into the matching categories'));
});

test('active My Drive resource cards provide previews or clear format details plus download', () => {
  assert.ok(source.includes("asset.kind === 'audio'"));
  assert.ok(source.includes("asset.kind === 'video'"));
  assert.ok(source.includes("asset.kind === 'image'"));
  assert.ok(source.includes("asset.kind === 'font'"));
  assert.ok(source.includes("asset.kind === 'template' || asset.kind === 'archive'"));
  assert.ok(source.includes("assetUrl(asset, 'download')"));
  assert.ok(rootHtml.includes('mydrive-generic-preview'));
});

test('workspace mobile layout keeps resource cards and action controls aligned', () => {
  assert.ok(rootHtml.includes('@media(max-width:600px)'));
  assert.ok(rootHtml.includes('.mydrive-items{grid-template-columns:minmax(0,1fr)'));
  assert.ok(rootHtml.includes('.mydrive-actions button,.mydrive-actions .mydrive-upload'));
});
