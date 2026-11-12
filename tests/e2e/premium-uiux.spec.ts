import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'compact-phone', width: 320, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'android-desktop-site', width: 980, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`premium surfaces and capsule controls remain usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('.ms-home-showcase')).toBeVisible();

    const styles = await page.evaluate(() => {
      const radius = (selector: string) => getComputedStyle(document.querySelector(selector)!).borderRadius;
      const height = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().height;
      return {
        showcaseRadius: radius('.ms-home-showcase'),
        serviceTileRadius: radius('.ms-service-tile'),
        primaryRadius: radius('.ms-primary'),
        contactRadius: radius('.ms-contact-panel'),
        primaryHeight: height('.ms-primary'),
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(parseFloat(styles.showcaseRadius)).toBeGreaterThanOrEqual(14);
    expect(parseFloat(styles.serviceTileRadius)).toBeGreaterThanOrEqual(10);
    expect(styles.primaryRadius).toBe('999px');
    expect(parseFloat(styles.contactRadius)).toBeGreaterThanOrEqual(14);
    expect(styles.primaryHeight).toBeGreaterThanOrEqual(42);
    expect(styles.documentWidth).toBeLessThanOrEqual(viewport.width + 2);
  });
}

test('keyboard focus remains clearly visible on primary actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const primary = page.locator('.ms-primary').first();
  await primary.focus();
  await expect(primary).toBeFocused();
  const outline = await primary.evaluate(element => getComputedStyle(element).outlineStyle);
  expect(outline).toBe('solid');
});
