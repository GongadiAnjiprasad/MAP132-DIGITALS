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
  // Start inside the visible enquiry heading; the full panel extends below the viewport.
  await dispatchTouchSwipe(page, '.ms-film-enquiry-heading', 'up');
  await expect.poll(() => contactPage.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 10);
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-400%\)/);
});


test('swiping updates a clearly selected page in both navigation indicators', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const headerActive = page.locator('.ms-nav button.active');
  const pagerActive = page.locator('.ms-pagination button.active');

  await expect(headerActive).toHaveText('Home');
  await expect(headerActive).toHaveAttribute('aria-current', 'page');
  await expect(pagerActive).toContainText('1');

  await dispatchTouchSwipe(page, '.ms-home-copy', 'left');

  await expect(page.locator('.ms-nav button.active')).toHaveText('Selected Work');
  await expect(page.locator('.ms-nav button.active')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.ms-pagination button.active')).toContainText('2');
  await page.waitForTimeout(750);

  // Advancing to the final page must bring its selected header label into view
  // by scrolling only the horizontal navigation container, not the page itself.
  const contactButton = page.locator('.ms-nav button.active');
  await dispatchTouchSwipe(page, '.ms-work-page .ms-page-heading', 'left');
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-200%\)/);
  await page.waitForTimeout(750);
  await dispatchTouchSwipe(page, '.ms-services-page .ms-page-heading', 'left');
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-300%\)/);
  await page.waitForTimeout(750);
  await dispatchTouchSwipe(page, '.ms-studio-page .ms-page-heading', 'left');
  await expect(page.locator('.ms-track')).toHaveAttribute('style', /translateX\(-400%\)/);
  await expect(contactButton).toHaveText('Contact');
  await expect.poll(() => page.locator('.ms-nav').evaluate(nav => {
    const button = nav.querySelector<HTMLElement>('button.active');
    if (!button) return false;
    const navRect = nav.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const fullyVisible = buttonRect.left >= navRect.left && buttonRect.right <= navRect.right;
    const navCenter = navRect.left + navRect.width / 2;
    const buttonCenter = buttonRect.left + buttonRect.width / 2;
    return fullyVisible && Math.abs(buttonCenter - navCenter) <= 24;
  })).toBe(true);

  const styles = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.ms-nav button.active');
    const pager = document.querySelector<HTMLElement>('.ms-pagination button.active');
    if (!header || !pager) throw new Error('Active page indicators are missing');
    return {
      headerBackground: getComputedStyle(header).backgroundImage,
      headerBorder: getComputedStyle(header).borderTopColor,
      pagerBackground: getComputedStyle(pager).backgroundImage,
    };
  });
  expect(styles.headerBackground).not.toBe('none');
  expect(styles.pagerBackground).not.toBe('none');
  // The active pager animates its text colour; wait for the transition to finish.
  await expect.poll(() => page.locator('.ms-pagination button.active').evaluate(
    element => getComputedStyle(element).color,
  )).toBe('rgb(23, 19, 13)');
});

test('Explore category tabs allow horizontal page swipe while category taps still work', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  // Wait for the page-track transition to settle before measuring and dispatching touch coordinates.
  await page.waitForTimeout(750);
  const firstCategory = page.locator('.work-category-tab').first();
  await expect(firstCategory).toBeVisible();

  // A finger swipe that begins directly on an Explore category chip must still navigate pages.
  await dispatchTouchSwipe(page, '.work-category-tab:first-child', 'left');
  await expect(track).toHaveAttribute('style', /translateX\(-200%\)/);

  // Returning and tapping the same chip must continue to select the category normally.
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  await firstCategory.click();
  await expect(firstCategory).toHaveAttribute('aria-pressed', 'true');
});


test('feedback review feed changes category with finger swipes without changing the website page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/reviews', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ reviews: [
      { id: 'video-review', kind: 'Work feedback', service: 'Cinematic Trailers', rating: 5, message: 'Excellent cinematic edit.', createdAt: '2026-11-09T10:00:00Z' },
      { id: 'site-review', kind: 'Website Experience', service: 'Website Experience', rating: 5, message: 'Easy navigation and great design.', createdAt: '2026-11-09T10:05:00Z' },
    ] }),
  }));
  await page.goto('/');
  const feed = page.locator('.ms-home-review-feed');
  const track = page.locator('.ms-track');
  await feed.scrollIntoViewIfNeeded();
  await expect(feed.getByRole('button', { name: 'Video Editing Service' })).toHaveAttribute('aria-pressed', 'true');
  await dispatchTouchSwipe(page, '.ms-home-review-feed', 'left');
  await expect(feed.getByRole('button', { name: 'Website Experience' })).toHaveAttribute('aria-pressed', 'true');
  await expect(feed.locator('.ms-review-card')).toContainText('Easy navigation and great design.');
  await dispatchTouchSwipe(page, '.ms-home-review-feed', 'right');
  await expect(feed.getByRole('button', { name: 'Video Editing Service' })).toHaveAttribute('aria-pressed', 'true');
  await expect(track).toHaveAttribute('style', /translateX\(0%\)/);
});


test('feedback review categories do not rotate automatically', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/reviews', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ reviews: [
      { id: 'video-review', kind: 'Work feedback', service: 'Cinematic Trailers', rating: 5, message: 'Excellent cinematic edit.', createdAt: '2026-11-09T10:00:00Z' },
      { id: 'site-review', kind: 'Website Experience', service: 'Website Experience', rating: 5, message: 'Easy navigation and great design.', createdAt: '2026-11-09T10:05:00Z' },
    ] }),
  }));
  await page.goto('/');
  const feed = page.locator('.ms-home-review-feed');
  await feed.scrollIntoViewIfNeeded();
  await expect(feed.getByRole('button', { name: 'Video Editing Service' })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(8300);
  await expect(feed.getByRole('button', { name: 'Video Editing Service' })).toHaveAttribute('aria-pressed', 'true');
  await expect(feed.getByRole('button', { name: 'Website Experience' })).toHaveAttribute('aria-pressed', 'false');
});
