import { test, expect } from '@playwright/test';

test('desktop service-card hover previews the matching ambient accent and resets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Services', exact: true }).click();
  const track = page.locator('.ms-track');
  // Let the page-slider transition settle before moving the pointer onto the card.
  await track.evaluate(async element => {
    // Await the active animation objects directly; a transitionend listener can
    // miss the event if the transition finishes between checking and subscribing.
    const running = element.getAnimations().filter(animation => animation.playState === 'running');
    await Promise.all(running.map(animation => animation.finished.catch(() => undefined)));
  });
  const site = page.locator('.map132-slider-site');
  const cinematic = page.locator('.ms-service-detail[data-service-theme="cinematic"]');
  await cinematic.hover();
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffcb78');
  await page.mouse.move(5, 5);
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#080d18');
});

test('service-card click pins its theme and a second click clears it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Services', exact: true }).click();
  const site = page.locator('.map132-slider-site');
  const ai = page.locator('.ms-service-detail[data-service-theme="ai"]');
  await ai.click();
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#00f2ff');
  await ai.click();
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#080d18');
});


test('showcase video playback temporarily overrides the pinned ambient theme and restores it on pause', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const site = page.locator('.map132-slider-site');
  await page.locator('.ms-service-tile[data-service-theme="cinematic"]').click();
  await expect(page.getByRole('dialog', { name: 'Cinematic Films video preview' })).toBeVisible();

  const dialog = page.locator('.ms-preview-dialog');
  const dialogHead = await dialog.locator('.ms-preview-dialog-head').boundingBox();
  if (!dialogHead) throw new Error('Preview header was not rendered.');
  const startX = dialogHead.x + dialogHead.width * 0.72;
  const startY = dialogHead.y + dialogHead.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 100, startY);
  await page.mouse.up();
  await expect(dialog.locator('h2')).toHaveText('Wedding & Celebrations');

  const player = dialog.locator('video');
  await player.evaluate(video => video.dispatchEvent(new Event('play')));
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffb45b');

  await player.evaluate(video => video.dispatchEvent(new Event('pause')));
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffcb78');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await site.evaluate(element => getComputedStyle(element).getPropertyValue('--ms-ambient-accent'))).toLowerCase()).toBe('#ffcb78');
});
