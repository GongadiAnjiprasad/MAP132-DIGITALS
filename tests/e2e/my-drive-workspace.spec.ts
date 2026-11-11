import { test, expect } from '@playwright/test';

test('My Drive is an independent tab and does not replace Free Sources', async ({ page }) => {
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

test('My Drive setup explains the admin sign-in requirement when the setup API rejects it', async ({ page }) => {
  await page.route('**/api/my-drive/lock/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ configured: false, unlocked: false })
  }));
  await page.route('**/api/my-drive/lock/setup', route => route.fulfill({
    status: 403, contentType: 'application/json',
    body: JSON.stringify({ error: 'Sign in to the MAP132 admin dashboard before creating the first My Drive password.' })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDriveSetupForm')).toBeVisible();
  await page.locator('#myDriveSetupPassword').fill('test-password-123');
  await page.locator('#myDriveSetupForm button[type="submit"]').click();
  await expect(page.locator('#myDriveStatus')).toContainText('Admin sign-in required');
  await expect(page.locator('#myDriveStatus a')).toHaveAttribute('href', 'index.html#admin');
});

test('connected My Drive displays saved persistent assets and refreshes the library', async ({ page }) => {
  await page.route('**/api/my-drive/lock/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ configured: true, unlocked: true })
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

test('My Drive tab and controls fit a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDrivePanel')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.locator('#myDriveSetupForm')).toBeVisible();
});


test('main Editor Workspace navigation opens the persistent My Drive page', async ({ page }) => {
  await page.goto('/index.html#workspace');
  await expect(page).toHaveURL(/\/workspace\.html$/);
  await expect(page.locator('#myDrivePanel')).toBeAttached();
  await page.locator('[data-resource-view="my-drive"]').click();
  await expect(page.locator('#myDriveSetupForm')).toBeVisible();
});

test('My Drive create-password field can be shown and hidden', async ({ page }) => {
  await page.route('**/api/my-drive/lock/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ configured: false, unlocked: false })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  const password = page.locator('#myDriveSetupPassword');
  const toggle = page.locator('#myDriveSetupToggle');
  await expect(password).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(toggle).toHaveAttribute('aria-label', 'Hide password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(toggle).toHaveAttribute('aria-label', 'Show password');
});

test('My Drive unlock-password field can be shown and hidden', async ({ page }) => {
  await page.route('**/api/my-drive/lock/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ configured: true, unlocked: false })
  }));
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="my-drive"]').click();
  const password = page.locator('#myDriveUnlockPassword');
  const toggle = page.locator('#myDriveUnlockToggle');
  await expect(password).toBeVisible();
  await expect(password).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
