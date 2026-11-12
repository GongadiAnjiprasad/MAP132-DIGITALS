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


test('My Drive lock status and setup errors are visible before unlock', () => {
  const statusIndex = rootHtml.indexOf('id="myDriveStatus"');
  const contentIndex = rootHtml.indexOf('id="myDriveContent"');
  assert.ok(statusIndex >= 0 && contentIndex > statusIndex, 'Status must render outside the hidden content container');
  assert.ok(rootHtml.includes('target="_blank" rel="noopener">Open Admin Dashboard'));
  assert.ok(rootHtml.includes('id="myDriveSetupToggle"'));
  assert.ok(rootHtml.includes('id="myDriveUnlockToggle"'));
});

test('Admin dashboard password input has a working show/hide control', () => {
  assert.ok(appSource.includes("type={showPassword?'text':'password'}"));
  assert.ok(appSource.includes("onClick={()=>setShowPassword(v=>!v)}"));
  assert.ok(appSource.includes("aria-label={showPassword?'Hide password':'Show password'}"));
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

test('My Drive password lock remains available when Google OAuth client config is incomplete', async () => {
  const oauthSource = readFileSync(new URL('../src/modules/my-drive-resource-manager/driveOAuth.ts', import.meta.url), 'utf8');
  assert.ok(oauthSource.includes('function lockConfigReady(env: DriveEnv): boolean'));
  assert.ok(oauthSource.includes('return Boolean(env.MAP132_KV && env.MY_DRIVE_SESSION_SECRET && env.MY_DRIVE_SESSION_SECRET.length >= 32)'));
  assert.ok(oauthSource.includes('return Boolean(lockConfigReady(env) && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)'));
  assert.ok(oauthSource.includes('lockEndpoint ? !lockConfigReady(env) : !configReady(env)'));
});


test('Google OAuth token exchange exposes only a sanitized provider error for diagnosis', async () => {
  const oauthSource = readFileSync(new URL('../src/modules/my-drive-resource-manager/driveOAuth.ts', import.meta.url), 'utf8');
  assert.ok(oauthSource.includes("const providerFailure = await tokenResponse.json().catch(() => ({}))"));
  assert.ok(oauthSource.includes(".replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)"));
  assert.ok(oauthSource.includes(".slice(0, 180)"));
  assert.ok(oauthSource.includes("Google token exchange failed (' + providerError + ')'"));
  assert.doesNotMatch(oauthSource, /console\\.(log|error)\\(.*(client_secret|refresh_token|code_verifier|access_token)/s);
});
