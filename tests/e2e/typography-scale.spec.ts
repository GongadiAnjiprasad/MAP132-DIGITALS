import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'small-mobile', width: 320, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'android-desktop-site', width: 980, height: 1740 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test('typography remains readable and aligned at ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('.ms-stage')).toBeVisible();
    const metrics = await page.evaluate(() => {
      const selectors = ['.ms-intro', '.ms-page-heading > p', '.ms-project-card p', '.ms-service-detail p', '.ms-process-grid p', '.ms-contact-copy > p:not(.ms-kicker)', '.ms-contact-panel label', '.ms-nav button'];
      const measured = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)).map(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { selector, fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight), width: rect.width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      }));
      const shell = document.querySelector('.map132-slider-site');
      return { viewportWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, shellWidth: shell.getBoundingClientRect().width, measured };
    });
    expect(metrics.documentWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(viewport.width + 2);
    expect(Math.abs(metrics.shellWidth - viewport.width), JSON.stringify(metrics)).toBeLessThanOrEqual(2);
    for (const item of metrics.measured) {
      expect(item.fontSize, item.selector + ' should remain readable: ' + JSON.stringify(item)).toBeGreaterThanOrEqual(viewport.width <= 760 ? 9.5 : 11);
      expect(item.lineHeight, item.selector + ' should have usable leading: ' + JSON.stringify(item)).toBeGreaterThanOrEqual(item.fontSize * 1.15);
    }
  });
}