// @provenance runId=2026-04-30T094508Z approvedAt=2026-04-30T12:32:41Z gate=test-draft-review
import { test, expect } from '@playwright/test';
import { ExampleDashboardPage } from '@pages/example/example.page.js';

test.describe('Example App — Dashboard (pipeline run 2026-04-30T094508Z)', () => {
  let dashboard: ExampleDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ExampleDashboardPage(page);
    await dashboard.goto();
  });

  // ── S01: Verify page structure and chrome ───────────────────────────

  test('S01 | page structure and chrome are correct', async () => {
    // Given — navigated to the dashboard (handled by beforeEach)

    // Then — the page heading is visible
    await expect(dashboard.heading).toBeVisible();

    // Then — the primary navigation bar is visible
    await expect(dashboard.nav).toBeVisible();

    // Then — Dashboard and Settings links are present in the nav
    await expect(dashboard.dashboardLink).toBeVisible();
    await expect(dashboard.dashboardLink).toHaveAttribute('href', '#dashboard');
    await expect(dashboard.settingsLink).toBeVisible();
    await expect(dashboard.settingsLink).toHaveAttribute('href', '#settings');

    // Then — section headings are visible
    await expect(dashboard.profileHeading).toBeVisible();
    await expect(dashboard.statusHeading).toBeVisible();
  });

  // ── S02: Verify profile form elements are present ───────────────────

  test('S02 | profile form elements are present', async () => {
    // Given — navigated to the dashboard

    // When — the page loads (handled by beforeEach)

    // Then — the profile settings form is visible
    await expect(dashboard.profileForm).toBeVisible();

    // Then — inputs are visible, enabled, and empty
    await expect(dashboard.displayNameInput).toBeVisible();
    await expect(dashboard.displayNameInput).toBeEnabled();
    await expect(dashboard.displayNameInput).toHaveValue('');

    await expect(dashboard.emailInput).toBeVisible();
    await expect(dashboard.emailInput).toBeEnabled();
    await expect(dashboard.emailInput).toHaveValue('');

    // Then — the Save Changes button is visible
    await expect(dashboard.saveButton).toBeVisible();
    await expect(dashboard.saveButton).toBeEnabled();

    // Then — initial status message is correct
    await expect(dashboard.statusMessage).toContainText('No changes saved yet.');
  });

  // ── S03: Submit profile form with valid inputs ──────────────────────

  test('S03 | submit profile form with valid inputs shows success', async () => {
    // Given — navigated to the dashboard

    // When — the user fills both fields and submits
    const name = await dashboard.submitProfile('Ada Lovelace', 'ada@example.test');

    // Then — the status message reflects the submitted name
    expect(name).toBe('Ada Lovelace');
    await expect(dashboard.statusMessage).toContainText('Saved changes for Ada Lovelace.');
  });

  // ── S04: Submit profile form with empty display name ────────────────

  test('S04 | submitting with empty display name shows fallback', async () => {
    // Given — navigated to the dashboard

    // When — the user fills only the email and clicks Save
    await dashboard.fillEmail('test@example.com');
    await dashboard.clickSave();

    // Then — the status message uses the "Unnamed user" fallback
    await expect(dashboard.statusMessage).toContainText('Saved changes for Unnamed user.');
  });

  // ── S05: Verify application status table content ────────────────────

  test('S05 | application status table contains expected data', async () => {
    // Given — navigated to the dashboard

    // When — the page loads (handled by beforeEach)

    // Then — the table is visible with correct column headers
    await expect(dashboard.statusTable).toBeVisible();
    await expect(dashboard.nameHeader).toBeVisible();
    await expect(dashboard.nameHeader).toHaveText('Name');
    await expect(dashboard.statusHeader).toBeVisible();
    await expect(dashboard.statusHeader).toHaveText('Status');

    // Then — the table contains exactly 3 data rows
    await expect(dashboard.dataRows).toHaveCount(3);

    // Then — each service shows the expected status
    const apiRow = dashboard.row('Example API');
    await expect(dashboard.cellAt(apiRow, 1)).toHaveText('Online');

    const workerRow = dashboard.row('Worker Queue');
    await expect(dashboard.cellAt(workerRow, 1)).toHaveText('Healthy');

    const notifRow = dashboard.row('Notification Service');
    await expect(dashboard.cellAt(notifRow, 1)).toHaveText('Paused');
  });

  // ── S06: Click Dashboard link scrolls to top ────────────────────────

  test('S06 | clicking Dashboard link scrolls to dashboard section', async () => {
    // Given — navigated to the dashboard

    // When — the user clicks the Dashboard nav link
    await dashboard.clickDashboardLink();

    // Then — the page heading is still visible (scrolled to top)
    await expect(dashboard.heading).toBeVisible();
  });

  // ── S07: Click Settings link navigates to settings section ──────────

  test('S07 | clicking Settings link navigates to Application Status', async () => {
    // Given — navigated to the dashboard

    // When — the user clicks the Settings nav link
    await dashboard.clickSettingsLink();

    // Then — the Application Status section is in view
    await expect(dashboard.statusHeading).toBeInViewport();
  });

  // ── S08: Form is clearable and re-submittable ───────────────────────

  test('S08 | form can be cleared and re-submitted with new values', async () => {
    // Given — a first submission has been made
    await dashboard.submitProfile('Ada Lovelace', 'ada@example.test');
    await expect(dashboard.statusMessage).toContainText('Ada Lovelace');

    // When — the user clears fields and submits new values
    await dashboard.displayNameInput.clear();
    await dashboard.emailInput.clear();
    await dashboard.submitProfile('Charles Babbage', 'charles@example.test');

    // Then — the status reflects the new submission
    await expect(dashboard.statusMessage).toContainText('Saved changes for Charles Babbage.');

    // Then — the old name is no longer present
    await expect(dashboard.statusMessage).not.toContainText('Ada Lovelace');
  });
});
