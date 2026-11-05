import { test, expect, type Page } from '@playwright/test';

async function dispatchTouchSwipe(
  page: Page,
  selector: string,
  direction: 'left' | 'right' | 'up',
) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Cannot locate swipe target: ${selector}`);
  const session = await page.context().newCDPSession(page);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const start = direction === 'left'
    ? { x: box.x + box.width * 0.82, y: centerY }
    : direction === 'right'
      ? { x: box.x + box.width * 0.18, y: centerY }
      : { x: centerX, y: box.y + box.height * 0.78 };
  const end = direction === 'left'
    ? { x: box.x + box.width * 0.18, y: centerY + 2 }
    : direction === 'right'
      ? { x: box.x + box.width * 0.82, y: centerY + 2 }
      : { x: centerX + 2, y: box.y + box.height * 0.18 };

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: start.x, y: start.y }],
  });
  for (let step = 1; step <= 8; step++) {
    const progress = step / 8;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        id: 1,
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      }],
    });
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await session.detach();
}
test('mobile horizontal swipe advances the main portfolio page', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await expect(page.locator('.ms-stage')).toBeVisible();

  await dispatchTouchSwipe(page, '.ms-home-copy', 'left');

  await expect(track).toHaveAttribute('style', /translateX\(-100%\)/);
});


test('Home showcase tiles support page swipe without breaking tile tap-to-preview', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  const firstTile = page.locator('.ms-service-tile').first();
  await expect(firstTile).toBeVisible();

  await dispatchTouchSwipe(page, '.ms-service-tile:first-child', 'left');
  await expect(track).toHaveAttribute('style', /translateX\(-100%\)/);

  // Return Home, then verify a normal tap still opens the selected sample.
  await page.waitForTimeout(500);
  await page.locator('.ms-nav').getByRole('button', { name: 'Home', exact: true }).click();
  await expect(track).toHaveAttribute('style', /translateX\(0%\)/);
  await page.waitForTimeout(750);
  await firstTile.click();
  await expect(page.locator('.ms-preview-dialog')).toBeVisible();
  await expect(page.locator('.ms-preview-dialog h2')).toHaveText('Cinematic Films');
});

test('page 5 Contact can swipe right back to page 4 Studio', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true }).click();
  await expect(track).toHaveAttribute('style', /translateX\(-400%\)/);
  // Allow the slider's 680ms transition to finish before calculating touch coordinates.
  await page.waitForTimeout(750);
  await page.locator('.ms-contact-steps').scrollIntoViewIfNeeded();

  await dispatchTouchSwipe(page, '.ms-contact-steps', 'right');

  await expect(track).toHaveAttribute('style', /translateX\(-300%\)/);
});

test('vertical touch movement does not change the active page', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await expect(page.locator('.ms-stage')).toBeVisible();

  await dispatchTouchSwipe(page, '.ms-home-copy', 'up');

  await expect(track).toHaveAttribute('style', /translateX\(0%\)/);
});

test('mobile swipe changes the showcase video in the preview modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Cinematic Films sample video' }).click();
  const dialog = page.locator('.ms-preview-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h2')).toHaveText('Cinematic Films');

  await dispatchTouchSwipe(page, '.ms-preview-player', 'left');

  await expect(dialog.locator('h2')).toHaveText('Wedding & Celebrations');
});

test('cinematic enquiry form submits in-page and shows confirmation without opening external links', async ({ page }) => {
  page.on('pageerror', error => console.log('ENQUIRY PAGE ERROR:', error.message));
  await page.route('**/api/enquiries', async route => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ submitted: true, id: 'e2e-enquiry' }),
  }));
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true }).click();
  const form = page.locator('.ms-film-enquiry form');
  await expect(form).toBeVisible();
  await form.locator('input[name="name"]').fill('Test Client');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form.locator('input[name="phone"]').fill('+919999999999');
  await form.locator('select[name="service"]').selectOption({ label: 'Cinematic Films' });
  await form.locator('textarea[name="details"]').fill('A cinematic trailer brief for browser testing.');
  const currentUrl = page.url();
  const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/enquiries') && request.method() === 'POST');
  const popupPromise = page.waitForEvent('popup', { timeout: 800 }).catch(() => null);
  await form.getByRole('button', { name: 'Submit Enquiry' }).click();
  await requestPromise;
  await expect(page.locator('.ms-enquiry-success h3')).toHaveText('Enquiry received.');
  expect(page.url()).toBe(currentUrl);
  expect(await popupPromise).toBeNull();
});

test('page 5 enquiry panel scrolls vertically with a finger without changing pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true }).click();
  const contactPage = page.locator('.ms-page').nth(4);
  const enquiry = page.locator('.ms-film-enquiry');
  await enquiry.scrollIntoViewIfNeeded();
  const metrics = await contactPage.evaluate(el => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    overflowY: getComputedStyle(el).overflowY,
    panelHeight: el.querySelector('.ms-film-enquiry')?.getBoundingClientRect().height,
    panelTop: el.querySelector('.ms-film-enquiry')?.getBoundingClientRect().top,
  }));
  console.log('PAGE5_ENQUIRY_SCROLL_METRICS', JSON.stringify(metrics));
  const before = metrics.scrollTop;
  await dispatchTouchSwipe(page, '.ms-film-enquiry', 'up');
  await expect.poll(() => contactPage.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 20);
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-400%\)/);
});
