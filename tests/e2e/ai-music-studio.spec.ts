import { test, expect } from '@playwright/test';

test('AI Music Studio opens and exposes duration, format and mixing controls on mobile and desktop', async ({ page }) => {
  await page.goto('/workspace.html');
  await page.locator('[data-resource-view="music"]').click();
  const panel = page.locator('[data-resource-panel="music"]');
  await expect(panel).toBeVisible();
  await expect(page.locator('#musicDuration')).toHaveValue('105');
  await expect(page.locator('#musicFormat')).toHaveValue('wav');
  await page.locator('#musicDuration').selectOption('custom');
  await expect(page.locator('#musicCustomDuration')).toBeVisible();
  await page.locator('#musicCustomDuration').fill('150');
  await expect(page.locator('#musicSfxFile')).toBeVisible();
  await expect(page.locator('#musicMainVolume')).toHaveValue('80');
  await expect(page.locator('#musicExportMix')).toContainText('48 kHz / 24-bit');
  await expect(page.locator('#musicGenerateButton')).toBeDisabled();
});
