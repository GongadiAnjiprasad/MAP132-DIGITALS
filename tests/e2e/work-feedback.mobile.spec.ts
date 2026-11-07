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
  await dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?').selectOption('Wedding / B’Day');
  await dialog.getByLabel('WHAT DID YOU LIKE — OR WHAT CAN WE IMPROVE?').fill('Super');
  await dialog.getByRole('button', { name: /Seal & send feedback/ }).tap();
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
    const submit = dialog.getByRole('button', { name: /Seal & send feedback/ });
    const drawer = await dialog.boundingBox();
    const button = await submit.boundingBox();
    expect(drawer, `drawer at ${width}px`).not.toBeNull();
    expect(button, `submit button at ${width}px`).not.toBeNull();
    expect(button!.x).toBeGreaterThanOrEqual(drawer!.x + 8);
    expect(button!.x + button!.width).toBeLessThanOrEqual(drawer!.x + drawer!.width - 8);
    expect(button!.width).toBeGreaterThan(0);
    await dialog.getByRole('button', { name: 'Close feedback' }).click();
  }
});
