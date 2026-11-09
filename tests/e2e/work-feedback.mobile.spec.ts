import { test, expect } from '@playwright/test';

test('mobile work feedback remains usable and submits a service-specific rating', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let payload: any = null;
  await page.route('**/api/feedback', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ submitted: true, id: 'test-mobile-feedback' }) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Video Editing Services/ }).tap();
  await dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?').selectOption('Wedding / B’Day');
  await dialog.getByRole('button', { name: '5 stars' }).tap();
  await dialog.getByLabel('YOUR FEEDBACK').fill('Super');
  await dialog.getByLabel(/I understand my feedback may be displayed publicly/).check();
  await dialog.getByRole('button', { name: /Send feedback/g }).tap();
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload.service).toBe('Wedding / B’Day');
  expect(payload.rating).toBe(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(392);
});

test('feedback seal button stays inside the parchment frame at narrow mobile and desktop widths', async ({ page }) => {
  for (const width of [320, 360, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 780 : 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Give feedback' }).click();
    const dialog = page.getByRole('dialog');
    const submit = dialog.getByRole('button', { name: /Send feedback/g });
    const drawer = await dialog.boundingBox();
    const button = await submit.boundingBox();
    expect(drawer, `drawer at ${width}px`).not.toBeNull();
    expect(button, `submit button at ${width}px`).not.toBeNull();
    expect(button!.x).toBeGreaterThanOrEqual(drawer!.x + 8);
    expect(button!.x + button!.width).toBeLessThanOrEqual(drawer!.x + drawer!.width - 8);
    expect(button!.width).toBeGreaterThan(0);
    await dialog.getByRole('button', { name: 'Close feedback', exact: true }).click();
  }
});


test('floating F stays in its original position with a frosted-glass finish and toggles the form closed', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Give feedback' });
    const before = await launcher.boundingBox();
    expect(before).not.toBeNull();
    await launcher.tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const openLauncher = page.getByRole('button', { name: 'Close feedback form' });
    await expect(openLauncher).toBeVisible();
    const [after, style, formBox] = await Promise.all([
      openLauncher.boundingBox(),
      openLauncher.evaluate(el => ({ backdrop: getComputedStyle(el, '::before').backdropFilter, position: getComputedStyle(el).position })),
      dialog.boundingBox(),
    ]);
    expect(after && before && formBox).toBeTruthy();
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
    expect(style.position).toBe('fixed');
    expect(style.backdrop).toContain('blur');
    expect(formBox!.y + formBox!.height).toBeLessThan(after!.y - 8);
    await openLauncher.tap();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Give feedback' })).toBeVisible();
  }
});

test('X closes the form independently while F remains in its original floating position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Give feedback' });
  const original = await launcher.boundingBox();
  await launcher.tap();
  const dialog = page.getByRole('dialog');
  await expect(page.getByRole('button', { name: 'Close feedback form' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close feedback', exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  const restored = await page.getByRole('button', { name: 'Give feedback' }).boundingBox();
  expect(restored && original).toBeTruthy();
  expect(Math.abs(restored!.x - original!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(restored!.y - original!.y)).toBeLessThanOrEqual(1);
});

test('feedback F toggle remains operable when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close feedback form' }).tap();
  await expect(dialog).toHaveCount(0);
});



test('open F glow follows the actual button silhouette without changing its size or position', async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Give feedback' });
    const [before, beforeStyle] = await Promise.all([
      launcher.boundingBox(),
      launcher.evaluate(el => {
        const button = getComputedStyle(el);
        const glow = getComputedStyle(el, '::before');
        return {
          width: button.width,
          height: button.height,
          position: button.position,
          glowWidth: glow.width,
          glowHeight: glow.height,
          glowRadius: glow.borderRadius,
          glowTransform: glow.transform,
        };
      }),
    ]);
    expect(before).not.toBeNull();
    await launcher.tap();
    const openLauncher = page.getByRole('button', { name: 'Close feedback form' });
    await expect(page.getByRole('dialog')).toBeVisible();
    const [after, afterStyle] = await Promise.all([
      openLauncher.boundingBox(),
      openLauncher.evaluate(el => {
        const button = getComputedStyle(el);
        const glow = getComputedStyle(el, '::before');
        return {
          width: button.width,
          height: button.height,
          position: button.position,
          glowWidth: glow.width,
          glowHeight: glow.height,
          glowRadius: glow.borderRadius,
          glowTransform: glow.transform,
          backdrop: glow.backdropFilter,
        };
      }),
    ]);
    expect(after).not.toBeNull();
    expect(afterStyle.position).toBe('fixed');
    expect(afterStyle.glowWidth).toBe(beforeStyle.glowWidth);
    expect(afterStyle.glowHeight).toBe(beforeStyle.glowHeight);
    expect(afterStyle.glowRadius).toBe(beforeStyle.glowRadius);
    expect(afterStyle.glowTransform).toBe(beforeStyle.glowTransform);
    expect(afterStyle.width).toBe(beforeStyle.width);
    expect(afterStyle.height).toBe(beforeStyle.height);
    expect(afterStyle.backdrop).toContain('blur');
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
    await openLauncher.tap();
  }
});


test('desktop feedback textarea submits on Enter and keeps Shift+Enter for a newline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let payload: any = null;
  await page.route('**/api/feedback', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ submitted: true, id: 'test-enter-feedback' }) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Video Editing Services/ }).click();
  await dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?').selectOption('Cinematic Trailers');
  await dialog.getByRole('button', { name: '5 stars' }).click();
  const textarea = dialog.getByLabel('YOUR FEEDBACK');
  await textarea.fill('First line');
  await textarea.press('Shift+Enter');
  await textarea.type('Second line');
  await expect(textarea).toHaveValue('First line\nSecond line');
  await dialog.getByLabel(/I understand my feedback may be displayed publicly/).check();
  await textarea.press('Enter');
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload.message).toBe('First line\nSecond line');
});
