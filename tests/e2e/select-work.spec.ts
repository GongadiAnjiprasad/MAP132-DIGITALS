import { test, expect } from '@playwright/test';

const categories = [
  'Cinematic Trailers',
  'Wedding / B’Day',
  'Advertisements',
  'AI Services',
  'Insta Reels',
  'YouTube Related',
];

test('Selected Work keeps category tabs visible and starts without an arbitrary all-project gallery', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const tabs = page.getByRole('group', { name: 'Choose a project category' });
  await expect(tabs).toBeVisible();
  await expect(page.locator('.ms-project-grid')).toHaveCount(0);
  await expect(page.locator('.ms-work-prompt')).toContainText('Select a category');
  for (const category of categories) {
    await expect(tabs.getByRole('button', { name: new RegExp(category) })).toBeVisible();
  }
});

test('Selecting a category updates the same page and keeps all category tabs available', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const tabs = page.getByRole('group', { name: 'Choose a project category' });
  const wedding = tabs.getByRole('button', { name: /Wedding \/ B’Day/ });
  await wedding.click();
  await expect(wedding).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ms-work-results-heading h3')).toHaveText('Wedding / B’Day');
  await expect(tabs).toBeVisible();
  await expect(page.locator('.ms-work-prompt')).toHaveCount(0);
  await expect(page.locator('.ms-sample-banner')).toContainText('No published projects in this category yet');
  await tabs.getByRole('button', { name: /AI Services/ }).click();
  await expect(tabs.getByRole('button', { name: /AI Services/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ms-work-results-heading h3')).toHaveText('AI Services');
  await expect(tabs).toBeVisible();
});

test('All Projects is an explicit tab choice and empty results are labelled honestly', async ({ page }) => {
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const allProjects = page.getByRole('button', { name: /View all projects/ });
  await allProjects.click();
  await expect(allProjects).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ms-work-results-heading h3')).toHaveText('All Projects');
  await expect(page.locator('.ms-sample-banner')).toContainText('No published projects yet');
});


test('Category chooser displays six tabs in a stable three-column by two-row grid without horizontal tab scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.ms-nav').getByRole('button', { name: 'Selected Work', exact: true }).click();
  const tabs = page.getByRole('group', { name: 'Choose a project category' });
  const buttons = tabs.getByRole('button');
  await expect(buttons).toHaveCount(6);
  const boxes = await buttons.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  expect(boxes[0].y).toBeCloseTo(boxes[1].y, 0);
  expect(boxes[1].y).toBeCloseTo(boxes[2].y, 0);
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y);
  expect(boxes[3].y).toBeCloseTo(boxes[4].y, 0);
  expect(boxes[4].y).toBeCloseTo(boxes[5].y, 0);
  expect(boxes[0].x).toBeLessThan(boxes[1].x);
  expect(boxes[1].x).toBeLessThan(boxes[2].x);
  expect(await tabs.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBeTruthy();
});
