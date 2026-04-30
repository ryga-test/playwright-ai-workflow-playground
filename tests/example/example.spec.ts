// @provenance runId=2026-04-30T093928Z approvedAt=2026-04-30T100906Z gate=test-draft-review
import { test, expect } from '@playwright/test';
import { ExampleDashboardPage } from '@pages/example/example.page.js';

test.describe('Example App — Dashboard (pipeline run 2026-04-30T093928Z)', () => {
  let dashboard: ExampleDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ExampleDashboardPage(page);
    await dashboard.goto();
  });

  // ── S01: Page loads with correct structure ──────────────────────────

  test('S01 | page loads with correct structure', async () => {
    // THEN the page heading "Workflow Playground Dashboard" is visible
    await expect(
      dashboard.page.getByRole('heading', { name: 'Workflow Playground Dashboard', level: 1 })
    ).toBeVisible();

    // THEN the primary navigation bar is visible
    await expect(dashboard.nav).toBeVisible();

    // THEN the "Dashboard" link is visible and points to "#dashboard"
    await expect(dashboard.dashboardLink).toBeVisible();
    await expect(dashboard.dashboardLink).toHaveAttribute('href', '#dashboard');

    // THEN the "Settings" link is visible and points to "#settings"
    await expect(dashboard.settingsLink).toBeVisible();
    await expect(dashboard.settingsLink).toHaveAttribute('href', '#settings');
  });

  // ── S02: Profile form renders all controls ──────────────────────────

  test('S02 | profile form renders all controls', async () => {
    // THEN the profile settings form is visible
    await expect(dashboard.profileForm).toBeVisible();

    // THEN the "Display name" textbox is visible, enabled, with placeholder "Ada Lovelace"
    await expect(dashboard.displayNameInput).toBeVisible();
    await expect(dashboard.displayNameInput).toBeEnabled();
    await expect(dashboard.displayNameInput).toHaveAttribute('placeholder', 'Ada Lovelace');

    // THEN the "Email address" textbox is visible, enabled, with placeholder "ada@example.test"
    await expect(dashboard.emailInput).toBeVisible();
    await expect(dashboard.emailInput).toBeEnabled();
    await expect(dashboard.emailInput).toHaveAttribute('placeholder', 'ada@example.test');

    // THEN the "Save Changes" button is visible and enabled
    await expect(dashboard.saveButton).toBeVisible();
    await expect(dashboard.saveButton).toBeEnabled();

    // THEN the status message reads "No changes saved yet."
    await expect(dashboard.statusMessage).toContainText('No changes saved yet.');
  });

  // ── S03: Fill and submit profile form ───────────────────────────────

  test('S03 | fill and submit profile form displays success message', async () => {
    // WHEN the user fills "Display name" with "Test User"
    // AND  fills "Email address" with "test@example.test"
    // AND  clicks "Save Changes"
    await dashboard.submitProfileForm('Test User', 'test@example.test');

    // THEN status message contains "Saved changes for Test User."
    await expect(dashboard.statusMessage).toContainText('Saved changes for Test User.');
  });

  // ── S04: Status table renders with correct structure ────────────────

  test('S04 | status table renders with correct structure', async () => {
    // THEN the "Application status table" is visible
    await expect(dashboard.statusTable).toBeVisible();

    // THEN the table contains exactly 4 rows (1 header + 3 data)
    await expect(dashboard.statusTableRows).toHaveCount(4);

    // THEN the header row contains "Name" and "Status"
    const headerRow = dashboard.rowByService('Name Status');
    await expect(headerRow).toContainText('Name');
    await expect(headerRow).toContainText('Status');
  });

  // ── S05: Status table data cells contain expected values ────────────

  test('S05 | status table data cells contain expected values', async () => {
    // THEN row "Example API Online" contains cells "Example API" and "Online"
    const apiRow = dashboard.rowByService('Example API Online');
    await expect(dashboard.cellInRow(apiRow, 'Example API')).toBeVisible();
    await expect(dashboard.cellInRow(apiRow, 'Online')).toBeVisible();

    // THEN row "Worker Queue Healthy" contains cells "Worker Queue" and "Healthy"
    const workerRow = dashboard.rowByService('Worker Queue Healthy');
    await expect(dashboard.cellInRow(workerRow, 'Worker Queue')).toBeVisible();
    await expect(dashboard.cellInRow(workerRow, 'Healthy')).toBeVisible();

    // THEN row "Notification Service Paused" contains cells "Notification Service" and "Paused"
    const notifRow = dashboard.rowByService('Notification Service Paused');
    await expect(dashboard.cellInRow(notifRow, 'Notification Service')).toBeVisible();
    await expect(dashboard.cellInRow(notifRow, 'Paused')).toBeVisible();
  });

  // ── S06: Submitting empty form shows fallback name ──────────────────

  test('S06 | submitting empty form shows fallback name', async () => {
    // WHEN the user clicks "Save Changes" without filling any fields
    await dashboard.clickSave();

    // THEN the status message reads "Saved changes for Unnamed user."
    await expect(dashboard.statusMessage).toContainText('Saved changes for Unnamed user.');
  });

  // ── S07: Navigation links remain visible after form interaction ─────

  test('S07 | navigation links remain visible after form interaction', async () => {
    // WHEN the user fills and submits the profile form
    await dashboard.submitProfileForm('Ada', 'ada@example.test');

    // THEN the "Dashboard" link is still visible
    await expect(dashboard.dashboardLink).toBeVisible();

    // THEN the "Settings" link is still visible
    await expect(dashboard.settingsLink).toBeVisible();
  });
});
