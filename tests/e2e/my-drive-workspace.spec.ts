import { test, expect } from '@playwright/test';

test('My Drive remains an independent tab and does not replace Free Sources', async ({ page }) => {
  await page.goto('/workspace.html');
  const sounds = page.locator('[data-resource-panel="sounds"]');
  const fonts = page.locator('[data-resource-panel="fonts"]');
  const myDrive = page.locator('[data-resource-panel="my-drive"]');
  await expect(sounds).toBeVisible();
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(myDrive).toBeVisible();
  await expect(sounds).toBeHidden();
  await expect(fonts).toBeHidden();
  await page.locator('[data-resource-view="fonts"]').click();
  await expect(fonts).toBeVisible();
  await page.locator('[data-resource-view="sounds"]').click();
  await expect(sounds).toBeVisible();
});

test('Signed-out users see inline Admin login and cannot access My Drive content', async ({ page }) => {
  await page.route('**/api/admin/session', route => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ authenticated: false, error: 'Admin session required.' })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDriveGate')).toBeVisible();
  await expect(page.locator('#myDriveLoginForm')).toBeVisible();
  await expect(page.locator('#myDriveAdminPassword')).toHaveAttribute('type', 'password');
  await expect(page.locator('#myDriveLoginSubmit')).toHaveText('Login');
  await expect(page.locator('#myDriveContent')).toBeHidden();
  await expect(page.locator('#myDriveLogout')).toBeHidden();
  await expect(page.locator('#myDriveStatus')).toContainText('Admin password');
});

test('Inline Admin login persists the HttpOnly session cookie across real same-origin requests and Logout clears it', async ({ page }) => {
  const cookieValue = 'browser-session-regression-token';
  let loginRequests = 0;
  let sessionRequests = 0;
  let logoutRequests = 0;

  await page.route('**/api/admin/session', async route => {
    sessionRequests += 1;
    const cookie = route.request().headers()['cookie'] || '';
    const authenticated = cookie.split(';').some(part => part.trim() === 'map132_admin=' + cookieValue);
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated })
    });
  });
  await page.route('**/api/admin/login', async route => {
    loginRequests += 1;
    const body = route.request().postDataJSON();
    if (body.password !== 'correct-password') {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Incorrect admin password.' }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Set-Cookie': 'map132_admin=' + cookieValue + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800' },
      body: JSON.stringify({ authenticated: true })
    });
  });
  await page.route('**/api/my-drive/session', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ connected: false, expiresAt: null })
  }));
  await page.route('**/api/admin/logout', async route => {
    logoutRequests += 1;
    const cookie = route.request().headers()['cookie'] || '';
    expect(cookie).toContain('map132_admin=' + cookieValue);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Set-Cookie': 'map132_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' },
      body: JSON.stringify({ signedOut: true })
    });
  });

  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await page.locator('#myDriveAdminPassword').fill('correct-password');
  await page.locator('#myDriveLoginSubmit').click();

  await expect(page.locator('#myDriveContent')).toBeVisible();
  await expect(page.locator('#myDriveLoginForm')).toBeHidden();
  await expect(page.locator('#myDriveLogout')).toBeVisible();
  await expect.poll(async () => (await page.context().cookies()).some(cookie => cookie.name === 'map132_admin' && cookie.value === cookieValue && cookie.httpOnly && cookie.secure)).toBe(true);
  expect(loginRequests).toBe(1);
  expect(sessionRequests).toBeGreaterThanOrEqual(2);

  await page.locator('#myDriveLogout').click();
  await expect(page.locator('#myDriveContent')).toBeHidden();
  await expect(page.locator('#myDriveLoginForm')).toBeVisible();
  await expect(page.locator('#myDriveStatus')).toContainText('Logged out');
  await expect.poll(async () => (await page.context().cookies()).some(cookie => cookie.name === 'map132_admin' && cookie.value === '')).toBe(false);
  expect(logoutRequests).toBe(1);
});

test('Connected My Drive displays saved persistent assets', async ({ page }) => {
  await page.route('**/api/admin/session', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true })
  }));
  await page.route('**/api/my-drive/session', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ connected: true, expiresAt: Date.now() + 60000 })
  }));
  await page.route('**/api/my-drive/assets?limit=50', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ assets: [{
      id: 'font-123', name: 'sample-font.ttf', kind: 'font', size: 1024,
      contentType: 'font/ttf', storedAt: '2026-11-12T10:00:00.000Z', licenseStatus: 'unverified'
    }], cursor: null })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDriveContent')).toBeVisible();
  await expect(page.locator('#myDriveItems')).toContainText('sample-font.ttf');
  await expect(page.locator('#myDriveItems a[download]')).toHaveAttribute('href', '/api/my-drive/assets/font-123/download');
  await expect(page.locator('#myDriveConnect')).toHaveText('Reconnect Google Drive');
});

test('My Drive tab and inline login controls fit a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/admin/session', route => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ authenticated: false })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDrivePanel')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.locator('#myDriveLoginForm')).toBeVisible();
  await expect(page.locator('#myDriveAdminPassword')).toBeVisible();
});

test('Main Editor Workspace navigation opens the persistent My Drive page', async ({ page }) => {
  await page.route('**/api/admin/session', route => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ authenticated: false })
  }));
  await page.goto('/index.html#workspace');
  await expect(page).toHaveURL(/\/workspace\.html$/);
  await expect(page.locator('#myDrivePanel')).toBeAttached();
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDriveLoginForm')).toBeVisible();
});

test('Admin dashboard password field can be shown and hidden', async ({ page }) => {
  await page.route('**/api/admin/session', route => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Admin session required.' })
  }));
  await page.goto('/index.html#admin');
  const password = page.locator('.login-password-field input');
  const toggle = page.locator('.login-password-field .password-visibility');
  await expect(password).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(toggle).toHaveAttribute('aria-label', 'Hide password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(toggle).toHaveAttribute('aria-label', 'Show password');
});


test('Inline Admin login retries session check if the initial signed-out check is still in flight', async ({ page }) => {
  let authenticated = false;
  let sessionCalls = 0;
  let signalInitialSessionStarted: (() => void) | undefined;
  let releaseInitialSession: (() => void) | undefined;
  const initialSessionStarted = new Promise<void>(resolve => { signalInitialSessionStarted = resolve; });
  const initialSessionGate = new Promise<void>(resolve => { releaseInitialSession = resolve; });

  await page.route('**/api/admin/session', async route => {
    sessionCalls += 1;
    if (sessionCalls === 1) {
      const wasAuthenticated = authenticated;
      signalInitialSessionStarted?.();
      await initialSessionGate;
      await route.fulfill({
        status: wasAuthenticated ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: wasAuthenticated })
      });
      return;
    }
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated })
    });
  });
  await page.route('**/api/admin/login', async route => {
    authenticated = route.request().postDataJSON().password === 'correct-password';
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated, error: authenticated ? undefined : 'Incorrect admin password.' })
    });
  });
  await page.route('**/api/my-drive/session', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ connected: false, expiresAt: null })
  }));

  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await initialSessionStarted;
  await page.locator('#myDriveAdminPassword').fill('correct-password');
  await page.locator('#myDriveLoginSubmit').click();
  await expect(page.locator('#myDriveLoginSubmit')).toBeDisabled();
  releaseInitialSession?.();

  await expect(page.locator('#myDriveContent')).toBeVisible();
  await expect(page.locator('#myDriveLoginForm')).toBeHidden();
  await expect(page.locator('#myDriveStatus')).toContainText('Connect Google Drive');
  expect(sessionCalls).toBeGreaterThanOrEqual(2);
});
