// @provenance runId=2026-05-02T061759Z approvedAt=2026-05-02T06:17:59.000Z gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { ExamplePage } from '@pages/example/example.page.js';

test.describe('Example application dashboard', () => {
  let app: ExamplePage;

  test.beforeEach(async ({ page }) => {
    app = new ExamplePage(page);
  });

  test('S01 — Page structure and landmarks are visible', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: page finishes loading
    // No explicit user action is required for this structure check.

    // Then — assert: verify the expected outcome
    await expect(app.pageHeading).toBeVisible();
    await expect(app.primaryNavigation).toBeVisible();
    await expect(app.profileSettingsRegion).toBeVisible();
    await expect(app.applicationStatusRegion).toBeVisible();
  });

  test('S02 — Navigation links target their page sections', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: perform the user action under test
    await app.openSettingsSection();

    // Then — assert: verify the expected outcome
    await expect(app.applicationStatusRegion).toBeInViewport();

    // When — act: perform the second navigation action
    await app.openDashboardSection();

    // Then — assert: verify the second expected outcome
    await expect(app.profileSettingsRegion).toBeInViewport();
  });

  test('S03 — Profile form exposes labelled editable fields', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: profile settings form is displayed
    // No explicit user action is required for this form structure check.

    // Then — assert: verify the expected outcome
    await expect(app.profileSettingsForm).toBeVisible();
    await expect(app.displayNameInput).toBeVisible();
    await expect(app.displayNameInput).toHaveValue('');
    await expect(app.emailAddressInput).toBeVisible();
    await expect(app.emailAddressInput).toHaveValue('');
    await expect(app.saveChangesButton).toBeVisible();
    await expect(app.statusMessage).toHaveText('No changes saved yet.');
  });

  test('S04 — User can submit profile details successfully', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: perform the user action under test
    await app.updateProfile('Ada Lovelace', 'ada@example.test');

    // Then — assert: verify the expected outcome
    await expect(app.statusMessage).toHaveText('Saved changes for Ada Lovelace.');
    await expect(app.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(app.emailAddressInput).toHaveValue('ada@example.test');
  });

  test('S05 — Empty display name uses the fallback user name', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: perform the user action under test
    await app.updateProfile('', 'anonymous@example.test');

    // Then — assert: verify the expected outcome
    await expect(app.statusMessage).toHaveText('Saved changes for Unnamed user.');
  });

  test('S06 — Re-submitting profile details replaces the previous status', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();
    await app.updateProfile('Ada Lovelace', 'ada@example.test');

    // When — act: perform the user action under test
    await app.displayNameInput.clear();
    await app.emailAddressInput.clear();
    await app.updateProfile('Charles Babbage', 'charles@example.test');

    // Then — assert: verify the expected outcome
    await expect(app.statusMessage).toHaveText('Saved changes for Charles Babbage.');
    await expect(app.statusMessage).not.toContainText('Ada Lovelace');
  });

  test('S07 — Application status table has expected headers', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: Application Status table is displayed
    // No explicit user action is required for this table header check.

    // Then — assert: verify the expected outcome
    await expect(app.applicationStatusTable).toBeVisible();
    await expect(app.nameColumnHeader).toBeVisible();
    await expect(app.statusColumnHeader).toBeVisible();
  });

  test('S08 — Application status table lists expected service states', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: Application Status table is displayed
    // No explicit user action is required for this table row check.

    // Then — assert: verify the expected outcome
    await expect(app.statusRow('Example API', 'Online')).toBeVisible();
    await expect(app.statusRow('Worker Queue', 'Healthy')).toBeVisible();
    await expect(app.statusRow('Notification Service', 'Paused')).toBeVisible();
  });

  test('S09 — Individual status table cells are accessible', async () => {
    // Given — arrange: navigate, set up preconditions
    await app.goto();

    // When — act: Application Status table is displayed
    // No explicit user action is required for this table cell check.

    // Then — assert: verify the expected outcome
    await expect(app.statusCell('Example API')).toBeVisible();
    await expect(app.statusCell('Online')).toBeVisible();
    await expect(app.statusCell('Worker Queue')).toBeVisible();
    await expect(app.statusCell('Healthy')).toBeVisible();
    await expect(app.statusCell('Notification Service')).toBeVisible();
    await expect(app.statusCell('Paused')).toBeVisible();
  });
});
