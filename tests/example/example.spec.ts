// @provenance runId=2026-05-01T025318Z approvedAt=2026-05-01T030659Z gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { ExampleAppPage } from '@pages/example/example.page.js';

test.describe('Example App — Dashboard (pipeline run 2026-05-01T025318Z)', () => {
  let dashboard: ExampleAppPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ExampleAppPage(page);
    await page.goto('/');
  });

  // ── S01: Verify page structure and chrome ───────────────────────────

  test('S01 | page structure and chrome are correct', async () => {
    // Given — navigated to the dashboard (handled by beforeEach)

    // Then — the h1 heading is visible
    await expect(dashboard.pageHeading).toBeVisible();

    // Then — section headings are visible
    await expect(dashboard.profileHeading).toBeVisible();
    await expect(dashboard.tableHeading).toBeVisible();

    // Then — Dashboard and Settings links are present with correct hrefs
    await expect(dashboard.dashboardLink).toBeVisible();
    await expect(dashboard.dashboardLink).toHaveAttribute('href', '#dashboard');
    await expect(dashboard.settingsLink).toBeVisible();
    await expect(dashboard.settingsLink).toHaveAttribute('href', '#settings');
  });

  // ── S02: Verify profile form initial state ──────────────────────────

  test('S02 | profile form renders with all elements and correct initial state', async () => {
    // Given — navigated to the dashboard

    // Then — the profile form is visible
    await expect(dashboard.settingsForm).toBeVisible();

    // Then — inputs are visible, enabled, and empty
    await expect(dashboard.displayNameInput).toBeVisible();
    await expect(dashboard.displayNameInput).toBeEnabled();
    await expect(dashboard.displayNameInput).toHaveValue('');

    await expect(dashboard.emailInput).toBeVisible();
    await expect(dashboard.emailInput).toBeEnabled();
    await expect(dashboard.emailInput).toHaveValue('');

    // Then — the Save Changes button is visible and enabled
    await expect(dashboard.saveButton).toBeVisible();
    await expect(dashboard.saveButton).toBeEnabled();

    // Then — initial status message is correct
    await expect(dashboard.statusMessage).toContainText('No changes saved yet.');
  });

  // ── S03: Form submission with valid inputs ──────────────────────────

  test('S03 | form submission with valid inputs updates status and retains values', async () => {
    // Given — navigated to the dashboard

    // When — the user fills both fields and clicks Save
    const name = await dashboard.updateProfile('Ada Lovelace', 'ada@example.test');

    // Then — the status message reflects the submitted name
    expect(name).toContain('Ada Lovelace');
    await expect(dashboard.statusMessage).toContainText('Saved changes for Ada Lovelace.');

    // Then — form inputs retain their values (form does not clear on submit)
    await expect(dashboard.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(dashboard.emailInput).toHaveValue('ada@example.test');
  });

  // ── S04: Empty display name fallback ────────────────────────────────

  test('S04 | submitting with empty display name shows Unnamed user fallback', async () => {
    // Given — navigated to the dashboard

    // When — the user fills only the email and clicks Save
    await dashboard.fillProfileForm('', 'test@example.com');
    await dashboard.saveProfile();

    // Then — the status message uses the "Unnamed user" fallback
    await expect(dashboard.statusMessage).toContainText('Saved changes for Unnamed user.');
  });

  // ── S05: Clear and re-submit with new values ────────────────────────

  test('S05 | form can be cleared and re-submitted with new values', async () => {
    // Given — a first submission has been made
    await dashboard.updateProfile('Ada Lovelace', 'ada@example.test');
    await expect(dashboard.statusMessage).toContainText('Ada Lovelace');

    // When — the user clears fields and submits new values
    await dashboard.displayNameInput.clear();
    await dashboard.emailInput.clear();
    await dashboard.fillProfileForm('Charles Babbage', 'charles@example.test');
    await dashboard.saveProfile();

    // Then — the status reflects the new submission
    await expect(dashboard.statusMessage).toContainText('Saved changes for Charles Babbage.');

    // Then — the old name is no longer present
    await expect(dashboard.statusMessage).not.toContainText('Ada Lovelace');
  });

  // ── S06: Serial form submissions without stale leakage ──────────────

  test('S06 | serial form submissions overwrite status without stale leakage', async () => {
    // Given — navigated to the dashboard

    // When — three profiles are submitted in sequence
    await dashboard.updateProfile('Alan Turing', 'alan@example.test');
    await expect(dashboard.statusMessage).toContainText('Saved changes for Alan Turing.');

    await dashboard.updateProfile('Grace Hopper', 'grace@example.test');
    await expect(dashboard.statusMessage).toContainText('Saved changes for Grace Hopper.');

    await dashboard.updateProfile('Margaret Hamilton', 'margaret@example.test');
    await expect(dashboard.statusMessage).toContainText('Saved changes for Margaret Hamilton.');

    // Then — status never contains previously-submitted names
    await expect(dashboard.statusMessage).not.toContainText('Alan Turing');
    await expect(dashboard.statusMessage).not.toContainText('Grace Hopper');
  });

  // ── S07: Dashboard nav link scrolls to top ──────────────────────────

  test('S07 | clicking Dashboard link scrolls to top, heading visible', async () => {
    // Given — navigated to the dashboard

    // When — the user clicks the Dashboard nav link
    await dashboard.goToDashboard();

    // Then — the page heading is still visible
    await expect(dashboard.pageHeading).toBeVisible();
  });

  // ── S08: Settings nav link scrolls to Application Status ────────────

  test('S08 | clicking Settings link scrolls to Application Status section', async () => {
    // Given — navigated to the dashboard

    // When — the user clicks the Settings nav link
    await dashboard.goToSettings();

    // Then — the Application Status heading is in viewport
    await expect(dashboard.tableHeading).toBeInViewport();
  });

  // ── S09: Application status table content ───────────────────────────

  test('S09 | application status table displays correct structure and data', async () => {
    // Given — navigated to the dashboard

    // Then — the table is visible with correct column headers
    await expect(dashboard.statusTable).toBeVisible();
    await expect(dashboard.nameColumnHeader).toBeVisible();
    await expect(dashboard.nameColumnHeader).toHaveText('Name');
    await expect(dashboard.statusColumnHeader).toBeVisible();
    await expect(dashboard.statusColumnHeader).toHaveText('Status');

    // Then — the table contains exactly 3 data rows
    await expect(dashboard.getTableRows()).toHaveCount(3);

    // Then — each service cell is present with the correct text
    await expect(dashboard.getCell('Example API')).toBeVisible();
    await expect(dashboard.getCell('Online')).toBeVisible();
    await expect(dashboard.getCell('Worker Queue')).toBeVisible();
    await expect(dashboard.getCell('Healthy')).toBeVisible();
    await expect(dashboard.getCell('Notification Service')).toBeVisible();
    await expect(dashboard.getCell('Paused')).toBeVisible();
  });
});
