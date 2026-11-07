import { test, expect } from '@playwright/test';

test('work feedback form collects a service rating and seals the submitted review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let payload: any = null;
  await page.route('**/api/feedback', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ submitted: true, id: 'test-work-feedback' }) });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Review our work.' })).toBeVisible();
  await dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?').selectOption('Cinematic Trailers');
  await dialog.getByRole('button', { name: '4 stars' }).click();
  await dialog.getByLabel('WHAT DID YOU LIKE — OR WHAT CAN WE IMPROVE?').fill('The pacing and colour grading were excellent.');
  await dialog.getByLabel('EMAIL (OPTIONAL)').fill('client@example.com');
  await dialog.getByRole('button', { name: /Seal & send feedback/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload).toEqual({
    service: 'Cinematic Trailers',
    rating: 4,
    message: 'The pacing and colour grading were excellent.',
    email: 'client@example.com',
  });
});

test('work feedback requires a service selection and a useful comment', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: /Seal & send feedback/ })).toBeDisabled();
  await expect(dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?')).toHaveAttribute('required', '');
  await expect(dialog.getByLabel('WHAT DID YOU LIKE — OR WHAT CAN WE IMPROVE?')).toHaveAttribute('minlength', '10');
});
