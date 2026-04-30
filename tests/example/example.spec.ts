import { test, expect } from '@playwright/test';

const BASE_URL = process.env.EXAMPLE_BASE_URL ?? 'http://localhost:3000';

test.describe('Example App — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('navigation links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('profile form renders inputs and button', async ({ page }) => {
    await expect(page.getByLabel('Display name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('profile form fill and submit', async ({ page }) => {
    await page.getByLabel('Display name').fill('Test User');
    await page.getByLabel('Email address').fill('test@example.test');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByRole('status')).toContainText('Saved changes for Test User.');
  });

  test('status table has correct rows', async ({ page }) => {
    const table = page.getByRole('table', { name: 'Application status table' });
    await expect(table).toBeVisible();

    const rows = table.getByRole('row');
    // 1 header + 3 data rows
    await expect(rows).toHaveCount(4);

    await expect(rows.nth(1)).toContainText('Example API');
    await expect(rows.nth(2)).toContainText('Worker Queue');
    await expect(rows.nth(3)).toContainText('Notification Service');
  });
});
