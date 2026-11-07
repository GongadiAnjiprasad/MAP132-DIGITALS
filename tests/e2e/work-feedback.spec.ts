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


test('feedback drawer inherits each active service theme accent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const themes = [
    { service: 'Cinematic Films', accent: '#FFCB78' },
    { service: 'Wedding & Celebrations', accent: '#FFB45B' },
    { service: 'Brand Promotions', accent: '#FFFFFF' },
    { service: 'AI Video Creation', accent: '#00F2FF' },
    { service: 'Reels & Shorts', accent: '#BC13FE' },
    { service: 'YouTube & Podcasts', accent: '#FF0000' },
  ];

  for (const theme of themes) {
    await page.getByRole('button', { name: `Play ${theme.service} sample video` }).click();
    await page.getByRole('button', { name: 'Close video' }).click();
    await page.getByRole('button', { name: 'Give feedback' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const inheritedAccent = await dialog.evaluate(element =>
      getComputedStyle(element).getPropertyValue('--ms-ambient-accent').trim()
    );
    expect(inheritedAccent.toLowerCase()).toBe(theme.accent.toLowerCase());
    const formAccent = await dialog.evaluate(element =>
      getComputedStyle(element).getPropertyValue('--feedback-accent').trim()
    );
    expect(formAccent.toLowerCase()).toBe(theme.accent.toLowerCase());
    await dialog.getByRole('button', { name: 'Close feedback' }).click();
  }
});
