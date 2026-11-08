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
  await dialog.getByLabel('YOUR FEEDBACK').fill('The pacing and colour grading were excellent.');
  await dialog.getByLabel('EMAIL (OPTIONAL)').fill('client@example.com');
  await dialog.getByLabel(/I understand my feedback may be displayed publicly/).check();
  await dialog.getByRole('button', { name: /Send feedback/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload).toEqual({
    kind: 'Work feedback',
    service: 'Cinematic Trailers',
    rating: 4,
    message: 'The pacing and colour grading were excellent.',
    email: 'client@example.com',
    publicConsent: true,
    aspects: [],
  });
});

test('work feedback enables after service selection and public display notice', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Give feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: /Send feedback/ })).toBeDisabled();
  await dialog.getByRole('button', { name: /Video Editing Services/ }).click();
  const service = dialog.getByLabel('WHICH SERVICE ARE YOU REVIEWING?');
  const message = dialog.getByLabel('YOUR FEEDBACK');
  const submit = dialog.getByRole('button', { name: /Send feedback/ });
  await expect(service).toHaveAttribute('required', '');
  await expect(message).toHaveAttribute('minlength', '1');
  await service.selectOption('Overall Studio Experience');
  await expect(submit).toBeDisabled();
  await message.fill('Super');
  await expect(submit).toBeDisabled();
  await dialog.getByRole('button', { name: '4 stars' }).click();
  await expect(submit).toBeDisabled();
  await dialog.getByLabel(/I understand my feedback may be displayed publicly/).check();
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
    const input = element.querySelector('textarea');
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

test('website experience feedback submits separately without a service selection', async ({ page }) => {
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
  await dialog.getByRole('button', { name: '5 stars' }).click();
  await dialog.getByLabel('YOUR FEEDBACK').fill('The site looks cinematic and is easy to explore on mobile.');
  await dialog.getByLabel(/I understand my feedback may be displayed publicly/).check();
  await dialog.getByRole('button', { name: /Send feedback/ }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you for your feedback.' })).toBeVisible();
  expect(payload).toEqual({
    kind: 'Website Experience',
    service: '',
    rating: 5,
    message: 'The site looks cinematic and is easy to explore on mobile.',
    email: '',
    publicConsent: true,
    aspects: ['Mobile experience'],
  });
});


test('Studio displays only reviews returned by the public reviews endpoint', async ({ page }) => {
  await page.route('**/api/reviews', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reviews:[{id:'review-1',service:'Cinematic Trailers',rating:5,message:'Excellent storytelling and polished editing.',createdAt:'2026-11-07T12:00:00.000Z'}]})}));
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Studio', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Client reviews' })).toBeVisible();
  await expect(reviews.getByText('Excellent storytelling and polished editing.')).toBeVisible();
  const reviews = page.getByRole('region', { name: 'Client reviews' });
  await expect(reviews.getByText('Cinematic Trailers', { exact: true })).toBeVisible();
});


test('admin feedback inbox does not require manual approval for legacy entries', async ({ page }) => {
  await page.route('**/api/admin/session', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not signed in' }) }));
  await page.route('**/api/admin/login', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: true }) }));
  await page.route('**/api/portfolio', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: {} }) }));
  await page.route('**/api/admin/feedback', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ feedback: [{
    id: 'private-review-1', kind: 'Work feedback', service: 'Cinematic Trailers', rating: 5,
    message: 'Excellent editing and storytelling.', email: 'client@example.com',
    createdAt: '2026-11-08T00:00:00.000Z', status: 'new', publicConsent: false, published: false,
  }] }) }));
  let publicationRequest: any = null;
  await page.route('**/api/admin/feedback/private-review-1/publish-with-consent', async route => {
    publicationRequest = { method: route.request().method(), body: route.request().postDataJSON() };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ published: true, publicConsent: true, consentSource: 'admin-confirmed' }) });
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/#admin');
  await page.getByPlaceholder('Enter your password').fill('test-admin-password');
  const loginResponse = page.waitForResponse(response =>
    response.url().includes('/api/admin/login') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /Secure sign in/ }).click();
  const loginResult = await loginResponse;
  expect(loginResult.status()).toBe(200);
  // Wait until the login screen has been removed from the React tree, then
  // synchronize against the authenticated dashboard's own sidebar.
  await expect(page.locator('.login-screen')).toHaveCount(0, { timeout: 15000 });
  const sidebar = page.locator('.admin-shell .admin-side');
  await expect(sidebar).toBeVisible({ timeout: 15000 });
  await expect(sidebar.locator('button.admin-nav')).toHaveCount(7, { timeout: 15000 });
  const feedbackTab = sidebar.getByRole('button', { name: /Customer Feedback/ });
  await expect(feedbackTab).toBeVisible({ timeout: 15000 });
  await feedbackTab.click();
  const review = page.locator('.feedback-inbox-item').filter({ hasText: 'Excellent editing and storytelling.' });
  await expect(review.getByText('OLDER ENTRY', { exact: true })).toBeVisible();
  await expect(review.getByRole('button', { name: /publish/i })).toHaveCount(0);
  await expect(review.getByRole('button', { name: /delete feedback/i })).toHaveCount(0);
});


test('homepage feedback tabs show only matching live reviews and refresh on focus', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/reviews', async route => {
    calls += 1;
    const reviews = calls <= 2 ? [] : [{
      id: 'live-service-review', kind: 'Work feedback', service: 'Cinematic Trailers',
      rating: 5, message: 'Mee service super undhi', response: 'Maa feedback share chesinanduku chala thanks!',
      createdAt: '2026-11-08T00:00:00.000Z'
    }];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reviews }) });
  });
  await page.goto('/');
  const feed = page.getByRole('region', { name: 'Client feedback feed' });
  await expect(feed).toBeVisible();
  await feed.getByRole('button', { name: 'Video Editing Service' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(feed.getByText('Mee service super undhi')).toBeVisible();
  await expect(feed.getByText('Maa feedback share chesinanduku chala thanks!')).toBeVisible();
  await feed.getByRole('button', { name: 'Website Experience' }).click();
  await expect(feed.getByText('No published feedback in this category yet.')).toBeVisible();
  expect(calls).toBeGreaterThanOrEqual(2);
});
