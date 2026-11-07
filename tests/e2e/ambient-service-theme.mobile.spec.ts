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


test('mobile DemoShowcase playback activates the page-wide atmosphere and pause resets it', async ({ page }) => {
  await page.goto('/');
  const site = page.locator('.map132-slider-site');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).tap();
  const player = page.locator('.studio-reel-media video').first();
  await expect(player).toHaveCount(1);
  await player.evaluate(video => video.dispatchEvent(new Event('play')));
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffcb78');
  for (const selector of ['.ms-header', '.ms-page', '.ms-controls', '.ms-footer']) {
    await expect.poll(async () => page.locator(selector).first().evaluate(element => {
      const style = getComputedStyle(element);
      const glow = getComputedStyle(element, '::before');
      return style.isolation === 'isolate' && glow.position === 'absolute' && glow.zIndex === '-1' && glow.backgroundImage.includes('radial-gradient');
    })).toBe(true);
  }
  expect(await player.evaluate(video => getComputedStyle(video).filter)).toBe('none');
  await player.evaluate(video => video.dispatchEvent(new Event('pause')));
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#080d18');
});

