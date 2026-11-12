import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'compact-phone', width: 320, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'android-desktop-site', width: 980, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`elite light theme stays polished and usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const site = page.locator('.map132-slider-site');
    const toggle = site.locator('.ms-theme-toggle');
    await expect(toggle).toBeVisible();
    if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
    await expect(site).toHaveAttribute('data-theme', 'light');

    const palette = await page.evaluate(() => {
      const read = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing element: ${selector}`);
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color, radius: style.borderRadius };
      };
      return {
        header: read('.ms-header'),
        showcase: read('.ms-home-showcase'),
        primary: read('.ms-primary'),
        service: read('.ms-service-detail'),
        contact: read('.ms-film-enquiry'),
        bodyWidth: document.documentElement.scrollWidth,
      };
    });
    expect(palette.header.background).toContain('250');
    expect(palette.showcase.background).toBe('rgb(255, 255, 255)');
    expect(palette.showcase.radius).toBe(viewport.width <= 760 ? '17px' : '22px');
    expect(palette.primary.radius).toBe('999px');
    expect(palette.primary.background).toBe('rgb(128, 85, 31)');
    expect(palette.service.background).toBe('rgb(255, 255, 255)');
    expect(palette.service.radius).toBe(viewport.width <= 760 ? '14px' : '17px');
    expect(palette.contact.background).toBe('rgb(255, 255, 255)');
    expect(palette.bodyWidth).toBeLessThanOrEqual(viewport.width + 2);
  });
}

test('light theme focus state is visible and dark theme remains available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const site = page.locator('.map132-slider-site');
  const toggle = site.locator('.ms-theme-toggle');
  if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  await expect(focused).toHaveCSS('outline-style', 'solid');
  await toggle.click();
  await expect(site).toHaveAttribute('data-theme', 'dark');
});
