import { test, expect, type Page } from '@playwright/test';

async function dispatchTouchSwipe(
  page: Page,
  selector: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  await page.locator(selector).evaluate((element, points) => {
    const target = element as HTMLElement;
    const first = new Touch({
      identifier: 1,
      target,
      clientX: points.start.x,
      clientY: points.start.y,
    });
    target.dispatchEvent(new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [first],
      targetTouches: [first],
      changedTouches: [first],
    }));

    const last = new Touch({
      identifier: 1,
      target,
      clientX: points.end.x,
      clientY: points.end.y,
    });
    target.dispatchEvent(new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: [last],
    }));
  }, { start, end });
}

test('mobile horizontal swipe advances the main portfolio page', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await expect(page.locator('.ms-stage')).toBeVisible();

  await dispatchTouchSwipe(page, '.ms-home-copy', { x: 330, y: 260 }, { x: 190, y: 264 });

  await expect(track).toHaveAttribute('style', /translateX\(-100%\)/);
});

test('vertical touch movement does not change the active page', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('.ms-track');
  await expect(page.locator('.ms-stage')).toBeVisible();

  await dispatchTouchSwipe(page, '.ms-home-copy', { x: 200, y: 220 }, { x: 205, y: 80 });

  await expect(track).toHaveAttribute('style', /translateX\(0%\)/);
});

test('mobile swipe changes the showcase video in the preview modal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Cinematic Films sample video' }).click();
  const dialog = page.locator('.ms-preview-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h2')).toHaveText('Cinematic Films');

  await dispatchTouchSwipe(page, '.ms-preview-stage', { x: 330, y: 260 }, { x: 180, y: 264 });

  await expect(dialog.locator('h2')).toHaveText('Wedding & Events');
});
