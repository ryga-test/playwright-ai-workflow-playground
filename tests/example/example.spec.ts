// @provenance runId=2026-05-09T123839Z approvedAt=2026-05-09T12:45:55.982Z gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { ExamplePage } from '@pages/example/example.page.js';

test.describe('Example application dashboard', () => {
  let app: ExamplePage;

  test.beforeEach(async ({ page }) => {
    app = new ExamplePage(page);
  });

  test('Scenario 1 — Page structure is visible', async () => {
    // Given — arrange: navigate to the dashboard.
    await app.goto();

    // When — act: allow the page to finish loading.
    await expect(app.profileSettingsForm).toBeVisible();

    // Then — assert: primary page structure is visible.
    await expect(app.pageHeading).toBeVisible();
    await expect(app.primaryNavigation).toBeVisible();
    await expect(app.profileSettingsRegion).toBeVisible();
    await expect(app.applicationStatusRegion).toBeVisible();
  });

  test('Scenario 2 — Primary navigation links target the expected sections', async () => {
    // Given — arrange: start on the dashboard.
    await app.goto();

    // When — act: navigate to Settings.
    await app.openSettingsSection();

    // Then — assert: the Application Status section is targeted.
    await expect(app.applicationStatusRegion).toBeInViewport();

    // When — act: navigate back to Dashboard.
    await app.openDashboardSection();

    // Then — assert: the Profile Settings section is targeted.
    await expect(app.profileSettingsRegion).toBeInViewport();
  });

  test('Scenario 3 — Profile form starts in its default empty state', async () => {
    // Given — arrange: open the dashboard.
    await app.goto();

    // When — act: inspect the displayed Profile Settings form.
    await expect(app.profileSettingsForm).toBeVisible();

    // Then — assert: fields and status use their defaults.
    await expect(app.displayNameInput).toHaveValue('');
    await expect(app.emailAddressInput).toHaveValue('');
    await expect(app.statusMessage).toHaveText('No changes saved yet.');
  });

  test('Scenario 4 — User can save profile changes with a display name', async () => {
    // Given — arrange: open the dashboard.
    await app.goto();
    await app.fillProfile('Ada Lovelace', 'ada@example.test');

    // When — act: save the profile.
    await app.saveProfile();

    // Then — assert: the status updates and input values are retained.
    await expect(app.statusMessage).toHaveText('Saved changes for Ada Lovelace.');
    await expect(app.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(app.emailAddressInput).toHaveValue('ada@example.test');
  });

  test('Scenario 5 — Empty display name falls back to Unnamed user', async () => {
    // Given — arrange: open the dashboard with an empty display name.
    await app.goto();
    await app.fillProfile('', 'unnamed@example.test');

    // When — act: save the profile.
    await app.saveProfile();

    // Then — assert: the fallback name is used.
    await expect(app.statusMessage).toHaveText('Saved changes for Unnamed user.');
  });

  test('Scenario 6 — Re-submitting profile changes replaces the previous status', async () => {
    // Given — arrange: save an initial profile.
    await app.goto();
    await app.updateProfile('Ada Lovelace', 'ada@example.test');

    // When — act: clear the form and save a different profile.
    await app.displayNameInput.clear();
    await app.emailAddressInput.clear();
    await app.updateProfile('Charles Babbage', 'charles@example.test');

    // Then — assert: only the latest profile appears in the status.
    await expect(app.statusMessage).toHaveText('Saved changes for Charles Babbage.');
    await expect(app.statusMessage).not.toContainText('Ada Lovelace');
  });

  test('Scenario 7 — Application status table structure is visible', async () => {
    // Given — arrange: open the dashboard.
    await app.goto();

    // When — act: inspect the Application Status table.
    await expect(app.applicationStatusTable).toBeVisible();

    // Then — assert: table structure is visible.
    await expect(app.nameColumnHeader).toBeVisible();
    await expect(app.statusColumnHeader).toBeVisible();
  });

  test('Scenario 8 — Application status table lists known service statuses', async () => {
    // Given — arrange: open the dashboard.
    await app.goto();

    // When — act: inspect the Application Status table.
    await expect(app.applicationStatusTable).toBeVisible();

    // Then — assert: known service/status rows are visible.
    await expect(app.statusRow('Example API', 'Online')).toBeVisible();
    await expect(app.statusRow('Worker Queue', 'Healthy')).toBeVisible();
    await expect(app.statusRow('Notification Service', 'Paused')).toBeVisible();
  });

  test('Scenario 9 — Individual table cells can be verified', async () => {
    // Given — arrange: open the dashboard.
    await app.goto();

    // When — act: inspect the Application Status table.
    await expect(app.applicationStatusTable).toBeVisible();

    // Then — assert: service and status cells are visible.
    await expect(app.statusCell('Example API')).toBeVisible();
    await expect(app.statusCell('Worker Queue')).toBeVisible();
    await expect(app.statusCell('Notification Service')).toBeVisible();
    await expect(app.statusCell('Online')).toBeVisible();
    await expect(app.statusCell('Healthy')).toBeVisible();
    await expect(app.statusCell('Paused')).toBeVisible();
  });
});
