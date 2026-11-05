import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'small-phone-320', width: 320, height: 640 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'large-phone-430', width: 430, height: 932 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
  { name: 'android-desktop-mode-980-portrait', width: 980, height: 1740 },
  { name: 'android-desktop-mode-980-short', width: 980, height: 800 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-desktop-1920', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`layout and Contact journey fit ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('.ms-stage')).toBeVisible();

    const homeMetrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      homeColumns: getComputedStyle(document.querySelector('.ms-home-page')!).gridTemplateColumns,
    }));
    expect(homeMetrics.document, `horizontal overflow on Home: ${JSON.stringify(homeMetrics)}`)
      .toBeLessThanOrEqual(viewport.width + 2);
    expect(homeMetrics.body, `body overflow on Home: ${JSON.stringify(homeMetrics)}`)
      .toBeLessThanOrEqual(viewport.width + 2);
    if (viewport.width > 760 && viewport.width <= 1100) {
      expect(homeMetrics.homeColumns.trim().split(/\s+/), `tablet/desktop-mode Home should use one column: ${JSON.stringify(homeMetrics)}`)
        .toHaveLength(1);
    }

    const contactButton = page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true });
    await expect(contactButton).toBeVisible();
    await contactButton.click();
    await expect(page.locator('.ms-film-enquiry form')).toBeVisible();

    const contactMetrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(contactMetrics.document, `horizontal overflow on Contact: ${JSON.stringify(contactMetrics)}`)
      .toBeLessThanOrEqual(viewport.width + 2);
    expect(contactMetrics.body, `body overflow on Contact: ${JSON.stringify(contactMetrics)}`)
      .toBeLessThanOrEqual(viewport.width + 2);

    await expect(page.locator(".ms-film-enquiry form").locator("input[name='name']")).toBeVisible();
    await expect(page.locator('.ms-film-enquiry form').getByRole('button', { name: 'Submit Enquiry' })).toBeVisible();
  });
}
