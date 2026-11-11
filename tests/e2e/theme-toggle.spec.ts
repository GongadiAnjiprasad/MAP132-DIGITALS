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


test('light theme keeps the homepage MAP132 logo and supporting text readable', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const site = page.locator('.map132-slider-site');
    const themeToggle = site.locator('button.ms-theme-toggle');
    await expect(themeToggle).toBeVisible();
    if (await themeToggle.getAttribute('aria-pressed') !== 'true') {
      await themeToggle.click();
    }
    await expect(site).toHaveAttribute('data-theme', 'light');

    const logo = site.locator('.ms-header .ms-brand img');
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    const logoStyle = await logo.evaluate(image => {
      const style = getComputedStyle(image);
      return { blendMode: style.mixBlendMode, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height };
    });
    expect(logoStyle.blendMode).toBe('normal');
    expect(logoStyle.width).toBeGreaterThan(0);
    expect(logoStyle.height).toBeGreaterThan(0);

    const textColours = await site.evaluate(element => {
      const read = (selector: string) => getComputedStyle(element.querySelector(selector)!).color;
      const root = getComputedStyle(element);
      return {
        gold: root.getPropertyValue('--ms-gold').trim(),
        homeProof: read('.ms-home-proof'),
        footer: read('.ms-footer'),
        placeholder: getComputedStyle(element.querySelector('.ms-contact-panel input')!, '::placeholder').color,
      };
    });
    expect(textColours.gold).toBe('#80551f');
    expect(textColours.homeProof).toBe('rgb(98, 93, 84)');
    expect(textColours.footer).toBe('rgb(98, 93, 84)');
    expect(textColours.placeholder).toBe('rgb(111, 109, 101)');
  }
});
