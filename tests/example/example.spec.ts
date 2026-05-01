// @provenance runId=2026-05-01T212504Z approvedAt=2026-05-02 gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { ExampleAppPage } from '@pages/example/example.page.js';

test.describe('Example App Dashboard', () => {
  let app: ExampleAppPage;

  test.beforeEach(async ({ page }) => {
    app = new ExampleAppPage(page);
    await page.goto('/');
  });

  // ── S01: Page structure — headings ──────────────────────────

  test('S01 — page loads with correct headings', async () => {
    await expect(app.pageHeading).toBeVisible();
    await expect(app.profileHeading).toBeVisible();
    await expect(app.tableHeading).toBeVisible();
  });

  // ── S02: Form structure — all elements present ──────────────

  test('S02 — profile form elements are present', async () => {
    await expect(app.settingsForm).toBeVisible();
    await expect(app.displayNameInput).toBeVisible();
    await expect(app.displayNameInput).toHaveAttribute('placeholder', 'Ada Lovelace');
    await expect(app.emailInput).toBeVisible();
    await expect(app.emailInput).toHaveAttribute('placeholder', 'ada@example.test');
    await expect(app.saveButton).toBeVisible();
    await expect(app.statusMessage).toHaveText('No changes saved yet.');
  });

  // ── S03: Form submit — status updates ───────────────────────

  test('S03 — fill and submit profile form updates status', async () => {
    const status = await app.updateProfile('Ada Lovelace', 'ada@example.test');
    expect(status).toContain('Ada Lovelace');
  });

  // ── S04: Empty display name — fallback behavior ─────────────

  test('S04 — submit with empty display name shows fallback', async () => {
    const status = await app.updateProfile('', 'ada@example.test');
    expect(status).toContain('Unnamed user');
  });

  // ── S05: Input value retention after submit ─────────────────

  test('S05 — form inputs retain values after submit', async () => {
    await app.fillProfileForm('Ada Lovelace', 'ada@example.test');
    await app.saveProfile();

    await expect(app.displayNameInput).toHaveValue('Ada Lovelace');
    await expect(app.emailInput).toHaveValue('ada@example.test');
  });

  // ── S06: Sequential submissions — only latest persists ──────

  test('S06 — status message updates correctly on sequential submissions', async () => {
    await app.updateProfile('Alan Turing', 'alan@example.test');
    await app.updateProfile('Grace Hopper', 'grace@example.test');
    const status = await app.updateProfile('Margaret Hamilton', 'margaret@example.test');

    expect(status).toContain('Margaret Hamilton');
    await expect(app.statusMessage).not.toContainText('Alan Turing');
    await expect(app.statusMessage).not.toContainText('Grace Hopper');
  });

  // ── S07: Navigation anchor links ────────────────────────────

  test('S07 — navigation links scroll to target sections', async () => {
    // Verify both sections are present
    await expect(app.pageHeading).toBeVisible();
    await expect(app.tableHeading).toBeVisible();

    // Click Settings — verify "Application Status" is in viewport
    await app.goToSettings();
    await expect(app.tableHeading).toBeInViewport();

    // Click Dashboard — verify h1 is in viewport
    await app.goToDashboard();
    await expect(app.pageHeading).toBeInViewport();
  });

  // ── S08: Table structure and content ────────────────────────

  test('S08 — table contains all expected service rows', async () => {
    await expect(app.statusTable).toBeVisible();
    await expect(app.nameColumnHeader).toBeVisible();
    await expect(app.statusColumnHeader).toBeVisible();

    // Exactly 3 data rows
    const rows = app.getTableRows();
    await expect(rows).toHaveCount(3);

    // Verify each row exists by accessible name
    await expect(app.page.getByRole('row', { name: /Example API\s+Online/ })).toBeVisible();
    await expect(app.page.getByRole('row', { name: /Worker Queue\s+Healthy/ })).toBeVisible();
    await expect(app.page.getByRole('row', { name: /Notification Service\s+Paused/ })).toBeVisible();
  });

  // ── S09: getCell() — individual cell access ─────────────────

  test('S09 — getCell() locates individual cells by accessible name', async () => {
    // Service name cells
    await expect(app.getCell('Example API')).toBeVisible();
    await expect(app.getCell('Worker Queue')).toBeVisible();
    await expect(app.getCell('Notification Service')).toBeVisible();

    // Status cells
    await expect(app.getCell('Online')).toBeVisible();
    await expect(app.getCell('Healthy')).toBeVisible();
    await expect(app.getCell('Paused')).toBeVisible();
  });
});
