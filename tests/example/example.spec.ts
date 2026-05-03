// @provenance runId=2026-05-03T021118Z approvedAt=2026-05-03T00:00:00.000Z gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { ExamplePage } from '@pages/example/example.page.js';

test.describe('Example application dashboard', () => {
  let app: ExamplePage;

  test.beforeEach(async ({ page }) => {
    app = new ExamplePage(page);
  });

  test('S01 — Dashboard shell renders primary landmarks', async () => {
    // Given
    await app.goto();

    // When
    // The dashboard shell finishes loading.

    // Then
    await expect(app.pageHeading).toBeVisible();
    await expect(app.primaryNavigation).toBeVisible();
    await expect(app.profileSettingsRegion).toBeVisible();
    await expect(app.applicationStatusRegion).toBeVisible();
  });

  test('S02 — Navigation links target dashboard and settings sections', async () => {
    // Given
    await app.goto();

    // When
    await app.openSettingsSection();

    // Then
    await expect(app.applicationStatusRegion).toBeInViewport();

    // When
    await app.openDashboardSection();

    // Then
    await expect(app.profileSettingsRegion).toBeInViewport();
  });

  test('S03 — Profile form fields are initially empty and ready for input', async () => {
    // Given
    await app.goto();

    // When
    // The Profile Settings form is displayed.

    // Then
    await expect(app.profileSettingsForm).toBeVisible();
    await expect(app.displayNameInput).toBeVisible();
    await expect(app.displayNameInput).toHaveValue('');
    await expect(app.emailAddressInput).toBeVisible();
    await expect(app.emailAddressInput).toHaveValue('');
    await expect(app.saveChangesButton).toBeVisible();
    await expect(app.statusMessage).toHaveText('No changes saved yet.');
  });

  test('S04 — Saving a completed profile updates the status message', async () => {
    // Given
    await app.goto();

    // When
    await app.updateProfile('Ada Lovelace', 'ada@example.test');

    // Then
    await expect(app.statusMessage).toHaveText('Saved changes for Ada Lovelace.');
    await expect(app.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(app.emailAddressInput).toHaveValue('ada@example.test');
  });

  test('S05 — Saving without a display name uses the fallback name', async () => {
    // Given
    await app.goto();

    // When
    await app.updateProfile('', 'anonymous@example.test');

    // Then
    await expect(app.statusMessage).toHaveText('Saved changes for Unnamed user.');
  });

  test('S06 — Re-submitting the form replaces the previous status', async () => {
    // Given
    await app.goto();
    await app.updateProfile('Ada Lovelace', 'ada@example.test');

    // When
    await app.displayNameInput.clear();
    await app.emailAddressInput.clear();
    await app.updateProfile('Charles Babbage', 'charles@example.test');

    // Then
    await expect(app.statusMessage).toHaveText('Saved changes for Charles Babbage.');
    await expect(app.statusMessage).not.toContainText('Ada Lovelace');
  });

  test('S07 — Application status table exposes expected headers and service rows', async () => {
    // Given
    await app.goto();

    // When
    // The Application Status table is displayed.

    // Then
    await expect(app.applicationStatusTable).toBeVisible();
    await expect(app.nameColumnHeader).toBeVisible();
    await expect(app.statusColumnHeader).toBeVisible();
    await expect(app.statusRow('Example API', 'Online')).toBeVisible();
    await expect(app.statusRow('Worker Queue', 'Healthy')).toBeVisible();
    await expect(app.statusRow('Notification Service', 'Paused')).toBeVisible();
  });

  test('S08 — Individual table cells are queryable by accessible name', async () => {
    // Given
    await app.goto();

    // When
    // The Application Status table is displayed.

    // Then
    await expect(app.statusCell('Example API')).toBeVisible();
    await expect(app.statusCell('Online')).toBeVisible();
    await expect(app.statusCell('Worker Queue')).toBeVisible();
    await expect(app.statusCell('Healthy')).toBeVisible();
    await expect(app.statusCell('Notification Service')).toBeVisible();
    await expect(app.statusCell('Paused')).toBeVisible();
  });

  test('S09 — Multiple sequential profile submissions keep only the latest status', async () => {
    // Given
    await app.goto();

    // When
    await app.updateProfile('Alan Turing', 'alan@example.test');
    await app.updateProfile('Grace Hopper', 'grace@example.test');
    await app.updateProfile('Margaret Hamilton', 'margaret@example.test');

    // Then
    await expect(app.statusMessage).toHaveText('Saved changes for Margaret Hamilton.');
    await expect(app.statusMessage).not.toContainText('Alan Turing');
    await expect(app.statusMessage).not.toContainText('Grace Hopper');
  });
});
