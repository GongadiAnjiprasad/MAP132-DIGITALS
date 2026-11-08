import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'narrow-mobile', width: 320, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'android-desktop-site', width: 980, height: 1740 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test('feedback dialog traps keyboard focus and closes with Escape at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Give feedback' });
    await expect(launcher).toBeVisible();
    await launcher.click();

    const dialog = page.locator('.feedback-drawer[role="dialog"]');
    const close = dialog.getByRole('button', { name: 'Close feedback' });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator('input[type="checkbox"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(launcher).toBeFocused();
  });

  test('workspace preview dialog traps focus and restores its trigger at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#workspace');
    await page.getByRole('button', { name: 'Add resource' }).click();
    await page.getByLabel('Resource title').fill('Keyboard test image');
    await page.getByLabel('Original resource page').fill('https://example.com/resource');
    await page.getByLabel('Direct preview media URL (MP3 / MP4 / image)').fill('https://example.com/preview.png');
    await page.getByLabel('Licence notes').fill('Test-only preview resource; no download or external action.');
    await page.getByRole('button', { name: 'Save to library' }).click();

    const trigger = page.getByRole('button', { name: 'Open preview' }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Keyboard test image' });
    const close = dialog.getByRole('button', { name: 'Close resource preview' });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    const sourceLink = dialog.getByRole('link', { name: /Open original resource page/ });
    await page.keyboard.press('Shift+Tab');
    await expect(sourceLink).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
