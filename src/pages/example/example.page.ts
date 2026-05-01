// @provenance runId=2026-05-01T025318Z approvedAt=2026-05-01T030234Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the Example App Dashboard.
 *
 * Models three page regions:
 *  - Navigation (Dashboard / Settings links)
 *  - Profile Settings Form (inputs, button, status message)
 *  - Application Status Table (column headers, data cells)
 *
 * All selectors use getByRole (P1 priority). The app has full ARIA
 * semantics with no testId attributes, making getByRole the natural
 * and most resilient locator strategy.
 */
export class ExampleAppPage {
  // ── Navigation ───────────────────────────────────────────────
  readonly dashboardLink: Locator;
  readonly settingsLink: Locator;

  // ── Profile Settings Form ────────────────────────────────────
  readonly settingsForm: Locator;
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;
  readonly statusMessage: Locator;

  // ── Application Status Table ─────────────────────────────────
  readonly statusTable: Locator;
  readonly nameColumnHeader: Locator;
  readonly statusColumnHeader: Locator;

  // ── Page Headings ────────────────────────────────────────────
  readonly pageHeading: Locator;
  readonly profileHeading: Locator;
  readonly tableHeading: Locator;

  constructor(public readonly page: Page) {
    // Navigation
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });

    // Profile Settings Form
    this.settingsForm = page.getByRole('form', { name: 'Profile settings form' });
    this.displayNameInput = page.getByRole('textbox', { name: 'Display name' });
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.statusMessage = page.getByRole('status');

    // Application Status Table
    this.statusTable = page.getByRole('table', { name: 'Application status table' });
    this.nameColumnHeader = page.getByRole('columnheader', { name: 'Name' });
    this.statusColumnHeader = page.getByRole('columnheader', { name: 'Status' });

    // Page Headings
    this.pageHeading = page.getByRole('heading', {
      name: 'Workflow Playground Dashboard',
      level: 1,
    });
    this.profileHeading = page.getByRole('heading', {
      name: 'Profile Settings',
      level: 2,
    });
    this.tableHeading = page.getByRole('heading', {
      name: 'Application Status',
      level: 2,
    });
  }

  // ── Navigation Actions ───────────────────────────────────────

  /** Navigate to the Dashboard section. */
  async goToDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  /** Navigate to the Settings section. */
  async goToSettings(): Promise<void> {
    await this.settingsLink.click();
  }

  // ── Form Actions ─────────────────────────────────────────────

  /**
   * Fill the profile settings form.
   * @param displayName - Value for the display name field.
   * @param email - Value for the email address field.
   */
  async fillProfileForm(displayName: string, email: string): Promise<void> {
    await this.displayNameInput.fill(displayName);
    await this.emailInput.fill(email);
  }

  /** Submit the profile settings form. */
  async saveProfile(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Convenience: fill the form and submit in one call.
   * @returns The status message text after submission.
   */
  async updateProfile(displayName: string, email: string): Promise<string> {
    await this.fillProfileForm(displayName, email);
    await this.saveProfile();
    await this.statusMessage.waitFor({ state: 'visible' });
    return (await this.statusMessage.textContent()) ?? '';
  }

  // ── Table Helpers ────────────────────────────────────────────

  /**
   * Get a data cell by its text content.
   * Useful for asserting individual cell values.
   */
  getCell(name: string): Locator {
    return this.page.getByRole('cell', { name });
  }

  /**
   * Get all data rows from the status table body.
   * Each row contains two cells: [serviceName, status].
   */
  getTableRows(): Locator {
    return this.statusTable.locator('tbody tr');
  }

  /**
   * Verify a specific service row exists with an expected status.
   * @param serviceName - The service cell text (e.g. "Example API").
   * @param expectedStatus - The expected status cell text (e.g. "Online").
   */
  async assertServiceStatus(serviceName: string, expectedStatus: string): Promise<void> {
    const cell = this.getCell(serviceName);
    await cell.waitFor({ state: 'visible' });

    // Locate the status cell in the same row as the service cell.
    // The row contains both cells; we target the row by its
    // accessible name (concatenated cell texts), then get the
    // second cell (status).
    const row = this.page.getByRole('row', {
      name: new RegExp(serviceName + '\\s+' + expectedStatus),
    });
    await row.waitFor({ state: 'visible' });
  }
}
