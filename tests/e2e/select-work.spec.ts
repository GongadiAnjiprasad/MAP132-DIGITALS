import { test, expect } from '@playwright/test';

const categories = [
  'Cinematic Trailers',
  'Wedding / B’Day',
  'Advertisements',
  'AI Services',
  'Insta Reels',
  'YouTube Related',
];

test('Selected Work starts with category choices instead of an all-project video wall', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const chooser = page.getByRole('group', { name: 'Choose a project category' });
  await expect(chooser).toBeVisible();
  await expect(page.locator('.demo-showcase')).toHaveCount(0);
  await expect(page.locator('.ms-service-tile')).toHaveCount(6);
  await expect(page.locator('.ms-category-showcase')).toHaveCount(0);
  await expect(page.locator('.ms-project-grid')).toHaveCount(0);
  await expect(page.locator('.ms-work-prompt')).toContainText('Choose a category above');
  const allProjects = page.getByRole('button', { name: /View all projects/ });
  await expect(allProjects).toHaveAttribute('aria-pressed', 'false');

  for (const category of categories) {
    await expect(chooser.getByRole('button', { name: category, exact: false })).toBeVisible();
  }
});

test('Selecting a category navigates to one matching preview and lets visitors change category', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const chooser = page.getByRole('group', { name: 'Choose a project category' });
  const wedding = chooser.getByRole('button', { name: /Wedding \/ B’Day/ });
  await wedding.click();
  await expect(wedding).toHaveAttribute('aria-pressed', 'true');
  const showcase = page.getByRole('region', { name: 'Category showcase preview' });
  await expect(showcase).toBeVisible();
  await expect(page.locator('.ms-category-showcase-media img')).toBeVisible();
  await expect(page.locator('.ms-category-showcase-copy')).toContainText('Wedding / B’Day');
  await expect.poll(() => page.locator('.ms-work-page').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator('.ms-project-grid')).toHaveCount(0);
  await expect(page.locator('.ms-sample-banner')).toContainText('No published projects in this category yet');

  await page.getByRole('button', { name: /Change category/ }).click();
  await expect(page.locator('.ms-category-showcase')).toHaveCount(0);
  await expect(page.locator('.ms-work-prompt')).toBeVisible();
  await expect.poll(() => page.locator('.ms-work-page').evaluate(element => element.scrollTop)).toBe(0);
});

test('All Projects is opt-in and does not create a gallery from sample moodboards', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const allProjects = page.getByRole('button', { name: /View all projects/ });
  await allProjects.click();
  await expect(allProjects).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', { name: 'Category showcase preview' })).toBeVisible();
  await expect(page.locator('.ms-category-showcase-media img')).toBeVisible();
  await expect(page.locator('.ms-project-grid')).toHaveCount(0);
  await expect(page.locator('.ms-sample-banner')).toContainText('No published projects yet');
  await expect.poll(() => page.locator('.ms-work-page').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
});
