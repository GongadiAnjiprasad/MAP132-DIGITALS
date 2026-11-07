import { test, expect } from '@playwright/test';

const categories = [
  'Cinematic Trailers',
  'Wedding / B’Day',
  'Advertisements',
  'AI Services',
  'Insta Reels',
  'YouTube Related',
];

test('Select Work explains all six categories and keeps All Projects available', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const chooser = page.getByRole('group', { name: 'Choose a project category' });
  await expect(chooser).toBeVisible();

  for (const category of categories) {
    await expect(chooser.getByRole('button', { name: category, exact: false })).toBeVisible();
  }

  const wedding = chooser.getByRole('button', { name: /Wedding \/ B’Day/ });
  await wedding.click();
  await expect(wedding).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.work-results-heading')).toContainText('WEDDING / B’DAY');

  const allProjects = page.getByRole('button', { name: /All Projects/ });
  await allProjects.click();
  await expect(allProjects).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.work-results-heading')).toContainText('ALL SELECTED PROJECTS');
});
