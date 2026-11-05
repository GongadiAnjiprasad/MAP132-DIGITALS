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

  await expect(dialog.locator('h2')).toHaveText('Wedding & Events');
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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Contact', exact: true }).click();
  const contactPage = page.locator('.ms-page').nth(4);
  const enquiry = page.locator('.ms-film-enquiry');
  await enquiry.scrollIntoViewIfNeeded();
  const before = await contactPage.evaluate(el => el.scrollTop);
  await dispatchTouchSwipe(page, '.ms-film-enquiry', 'up');
  await expect.poll(() => contactPage.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 20);
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-400%\)/);
});
