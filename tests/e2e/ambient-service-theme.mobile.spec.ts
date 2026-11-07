import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('mobile tap applies service accent without horizontal overflow', async ({ page }) => {
    await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Services', exact: true }).click();
  const site = page.locator('.map132-slider-site');
  await page.locator('.ms-service-detail[data-service-theme="reels"]').tap();
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#bc13fe');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(392);
});


test('mobile video playback applies the page-wide atmosphere while leaving the player clear', async ({ page }) => {
  await page.goto('/');
  const site = page.locator('.map132-slider-site');
  await page.locator('.ms-service-tile[data-service-theme="celebrations"]').tap();
  const player = page.locator('.ms-preview-player');
  await player.evaluate(video => video.dispatchEvent(new Event('play')));
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffb45b');
  for (const selector of ['.ms-header', '.ms-page', '.ms-controls', '.ms-footer']) {
    await expect.poll(async () => page.locator(selector).first().evaluate(element => getComputedStyle(element).backgroundBlendMode)).toBe('screen');
  }
  expect(await player.evaluate(video => getComputedStyle(video).filter)).toBe('none');
  await player.evaluate(video => video.dispatchEvent(new Event('pause')));
});
