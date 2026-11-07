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
  await expect(dialog.getByRole('heading', { name: /Your voice/ })).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'MAP132 DIGITALS' })).toBeVisible();
  await dialog.getByRole('button', { name: /Video Editing Services/ }).click();
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
  await expect(dialog.getByRole('button', { name: /Send feedback/ })).toBeDisabled();
  await dialog.getByRole('button', { name: /Video Editing Services/ }).click();
  const service = dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?');
  const message = dialog.getByLabel('WHAT DID YOU LIKE — OR WHAT CAN WE IMPROVE?');
  const submit = dialog.getByRole('button', { name: /Send feedback/ });
  await expect(service).toHaveAttribute('required', '');
  await expect(message).toHaveAttribute('minlength', '1');
  await service.selectOption('Overall Studio Experience');
  await expect(submit).toBeDisabled();
  await message.fill('Super');
  await expect(submit).toBeEnabled();
  await message.fill('   ');
  await expect(submit).toBeDisabled();
});


test('feedback drawer stays on the MAP132 brand accent across all service themes', async ({ page }) => {
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
    const accents = await dialog.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        form: styles.getPropertyValue('--feedback-accent').trim(),
        brand: styles.getPropertyValue('--brand-amber').trim(),
      };
    });
    // Feedback follows the effective MAP132 brand token, never the active genre accent.
    expect(accents.form.toLowerCase()).toBe(accents.brand.toLowerCase());
    await dialog.getByRole('button', { name: 'Close feedback' }).click();
  }
});


test('feedback drawer uses the MAP132 cinematic studio design system', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const design = await dialog.evaluate(element => {
    const heading = element.querySelector('.feedback-drawer-head h2');
    const input = element.querySelector('.feedback-category-grid button');
    const submit = element.querySelector('.feedback-submit');
    const brand = element.querySelector('.feedback-studio-brand img');
    return {
      background: getComputedStyle(element).backgroundImage,
      backdropFilter: getComputedStyle(element).backdropFilter,
      borderRadius: getComputedStyle(element).borderRadius,
      headingFont: getComputedStyle(heading!).fontFamily,
      inputBackground: getComputedStyle(input!).backgroundColor,
      submitBackground: getComputedStyle(submit!).backgroundImage,
      logoAlt: brand?.getAttribute('alt') || '',
      accent: getComputedStyle(element).getPropertyValue('--feedback-accent').trim(),
    };
  });

  expect(design.background).toContain('radial-gradient');
  expect(design.backdropFilter).toContain('blur');
  expect(design.borderRadius).not.toBe('0px');
  expect(design.headingFont.toLowerCase()).toContain('manrope');
  expect(design.inputBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(design.submitBackground).toContain('linear-gradient');
  expect(design.logoAlt).toBe('MAP132 DIGITALS');
  expect(design.accent).not.toBe('');
});

test('website experience feedback submits separately without requiring a service', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let payload: any = null;
  await page.route('**/api/feedback', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ submitted: true, id: 'website-experience-feedback' }) });
  });
  await page.goto('/');
  const launcher = page.getByRole('button', { name: 'Give feedback' });
  await expect(launcher.locator('.feedback-mark')).toHaveText('F');
  await launcher.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Website Experience/ }).click();
  await dialog.getByRole('button', { name: 'Mobile experience' }).click();
  await dialog.getByLabel('YOUR FEEDBACK').fill('The site looks cinematic and is easy to explore on mobile.');
  await dialog.getByRole('button', { name: /Send feedback/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload).toEqual({
    kind: 'Website Experience',
    service: '',
    rating: 5,
    message: 'The site looks cinematic and is easy to explore on mobile.',
    email: '',
    aspects: ['Mobile experience'],
  });
});
