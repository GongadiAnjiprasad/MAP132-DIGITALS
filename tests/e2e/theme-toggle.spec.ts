import { test, expect } from '@playwright/test';

test('theme toggle switches palettes and remembers the choice after reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const site = page.locator('.map132-slider-site');
  await expect(site).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(site).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  const lightBackground = await page.locator('.ms-header').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(lightBackground).toContain('250');
  await page.reload();
  await expect(page.locator('.map132-slider-site')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('.map132-slider-site')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('.map132-slider-site')).toHaveAttribute('data-theme', 'dark');
});

test('theme toggle remains available on mobile without breaking page width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Switch to light theme' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('.map132-slider-site')).toHaveAttribute('data-theme', 'light');
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(392);
});
