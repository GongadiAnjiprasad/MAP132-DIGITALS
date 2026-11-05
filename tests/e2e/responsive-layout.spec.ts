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
    if (viewport.width > 760 && viewport.width < 900) {
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


test('Android desktop-site viewport keeps content top-led, readable and balanced', async ({ page }) => {
  for (const height of [1740, 800]) {
    await page.setViewportSize({ width: 980, height });
    await page.goto('/');
    const home = await page.locator('.ms-home-page').evaluate(element => {
      const page = element as HTMLElement;
      const heading = page.querySelector('.ms-home-copy h1')!;
      const intro = page.querySelector('.ms-intro')!;
      const style = getComputedStyle(page);
      return {
        columns: style.gridTemplateColumns.trim().split(/\s+/).length,
        alignContent: style.alignContent,
        headingSize: parseFloat(getComputedStyle(heading).fontSize),
        introSize: parseFloat(getComputedStyle(intro).fontSize),
      };
    });
    expect(home.columns, 'desktop-site Home should retain a balanced two-column composition').toBe(2);
    expect(home.alignContent).toBe('start');
    expect(home.headingSize).toBeGreaterThanOrEqual(48);
    expect(home.introSize).toBeGreaterThanOrEqual(14);

    for (const selector of ['.ms-work-page', '.ms-services-page', '.ms-studio-page']) {
      const layout = await page.locator(selector).evaluate(element => ({
        display: getComputedStyle(element).display,
        alignContent: getComputedStyle(element).alignContent,
      }));
      expect(layout.display, selector).not.toBe('flex');
      expect(layout.alignContent, selector).toBe('start');
    }
  }
});


test('desktop-site viewport stage follows the active page content height', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 800 });
  await page.goto('/');
  const measure = () => page.evaluate(() => {
    const stage = document.querySelector('.ms-stage') as HTMLElement;
    const activeIndex = Array.from(document.querySelectorAll('.ms-nav button')).findIndex(button => button.classList.contains('active'));
    const active = stage.querySelectorAll<HTMLElement>('.ms-page')[Math.max(0, activeIndex)];
    return { stage: stage.clientHeight, content: active.scrollHeight };
  });
  await expect.poll(async () => {
    const m = await measure();
    return Math.abs(m.stage - m.content);
  }).toBeLessThanOrEqual(3);

  await page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true }).click();
  await expect(page.locator('.ms-film-enquiry form')).toBeVisible();
  await expect.poll(async () => {
    const m = await measure();
    return Math.abs(m.stage - m.content);
  }).toBeLessThanOrEqual(3);
});
