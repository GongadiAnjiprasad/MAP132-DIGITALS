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
