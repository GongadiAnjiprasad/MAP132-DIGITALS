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

test('work feedback starts disabled and enables for a one-word review only after service selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: /Seal & send feedback/ })).toBeDisabled();
  const service = dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?');
  const message = dialog.getByLabel('WHAT DID YOU LIKE — OR WHAT CAN WE IMPROVE?');
  const submit = dialog.getByRole('button', { name: /Seal & send feedback/ });
  await expect(service).toHaveAttribute('required', '');
  await expect(message).toHaveAttribute('minlength', '1');
  await service.selectOption('Overall Studio Experience');
  await expect(submit).toBeDisabled();
  await message.fill('Super');
  await expect(submit).toBeEnabled();
  await message.fill('   ');
  await expect(submit).toBeDisabled();
});


test('desktop feedback email and seal action stay inside the parchment drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  const drawer = await dialog.boundingBox();
  const email = await dialog.getByLabel('EMAIL (OPTIONAL)').boundingBox();
  const submit = await dialog.getByRole('button', { name: /Seal & send feedback/ }).boundingBox();
  expect(drawer).not.toBeNull();
  expect(email).not.toBeNull();
  expect(submit).not.toBeNull();
  const inset = 12;
  for (const control of [email!, submit!]) {
    expect(control.x).toBeGreaterThanOrEqual(drawer!.x + inset);
    expect(control.x + control.width).toBeLessThanOrEqual(drawer!.x + drawer!.width - inset);
  }
});
