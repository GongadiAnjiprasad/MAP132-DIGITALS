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
