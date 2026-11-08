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
    await page.evaluate(() => {
      localStorage.setItem('map132-private-workspace-resources', JSON.stringify([{
        id: 'keyboard-test-image',
        title: 'Keyboard test image',
        category: 'Music & BGM',
        detail: 'Local-only image fixture for dialog accessibility checks.',
        href: 'https://example.com/resource',
        provider: 'Playwright fixture',
        licence: 'Test fixture only; no download or external action.',
        tags: ['test'],
        compatibility: 'Browser preview',
        kind: 'image',
        previewUrl: 'https://example.com/preview.png',
        downloadUrl: ''
      }]));
    });
    await page.route('https://example.com/**', route => route.abort());
    await page.reload();
    await expect(page.getByText('Keyboard test image', { exact: true })).toBeVisible();

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

  test('showcase video preview contains keyboard focus and restores its service trigger at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.route('https://videos.pexels.com/**', route => route.abort());
    await page.goto('/');
    await page.locator('.ms-nav').getByRole('button', { name: 'Services', exact: true }).click();

    const trigger = page.getByRole('button', { name: 'Play Cinematic Films sample video' });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Cinematic Films video preview' });
    const close = dialog.getByRole('button', { name: 'Close video' });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    const video = dialog.locator('video[controls]');
    await page.keyboard.press('Shift+Tab');
    await expect(video).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
