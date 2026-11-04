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
