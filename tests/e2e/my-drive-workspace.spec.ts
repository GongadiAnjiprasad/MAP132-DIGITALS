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

test('My Drive tab and controls fit a narrow mobile viewport', async ({ page }) => {
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
