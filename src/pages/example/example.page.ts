// @provenance runId=2026-04-30T093928Z approvedAt=2026-04-30T095710Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the Example application dashboard.
 *
 * All locators use Priority 1 (`getByRole`) — backed by the ARIA snapshot
 * from step2-discover and normalized in step3-extract-selectors.
 *
 * Generated: 2026-04-30T093928Z
 */

export class ExampleDashboardPage {
  // ── Navigation ──────────────────────────────────────────────────────

  /** Primary navigation bar (scoping container) */
  readonly nav: Locator;
  /** Dashboard link in primary nav */
  readonly dashboardLink: Locator;
  /** Settings link in primary nav */
  readonly settingsLink: Locator;

  // ── Profile Form ────────────────────────────────────────────────────

  /** Profile settings form (scoping container) */
  readonly profileForm: Locator;
  /** "Display name" textbox */
  readonly displayNameInput: Locator;
  /** "Email address" textbox */
  readonly emailInput: Locator;
  /** "Save Changes" submit button */
  readonly saveButton: Locator;
  /** Status message live region (aria-live="polite") */
  readonly statusMessage: Locator;

  // ── Status Table ────────────────────────────────────────────────────

  /** Application status table */
  readonly statusTable: Locator;
  /** All rows in the status table (header + data) */
  readonly statusTableRows: Locator;

  // ────────────────────────────────────────────────────────────────────

  constructor(public readonly page: Page) {
    // Navigation
    this.nav = page.getByRole('navigation', { name: 'Primary navigation' });
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });

    // Profile form
    this.profileForm = page.getByRole('form', { name: 'Profile settings form' });
    this.displayNameInput = page.getByRole('textbox', { name: 'Display name' });
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.statusMessage = page.getByRole('status');

    // Status table
    this.statusTable = page.getByRole('table', { name: 'Application status table' });
    this.statusTableRows = this.statusTable.getByRole('row');
  }

  // ── Navigation actions ──────────────────────────────────────────────

  /** Navigate to the dashboard page. Uses baseURL from playwright.config if set. */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Click the Dashboard nav link */
  async clickDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  /** Click the Settings nav link */
  async clickSettings(): Promise<void> {
    await this.settingsLink.click();
  }

  // ── Form actions ────────────────────────────────────────────────────

  /** Fill the profile form and submit.
   *  @returns The name that will appear in the status message (or "Unnamed user" if blank). */
  async submitProfileForm(displayName: string, email: string): Promise<string> {
    await this.displayNameInput.fill(displayName);
    await this.emailInput.fill(email);
    await this.saveButton.click();
    return displayName || 'Unnamed user';
  }

  /** Fill only the display name and submit */
  async fillDisplayName(name: string): Promise<void> {
    await this.displayNameInput.fill(name);
  }

  /** Fill only the email and submit */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Click save without filling any fields */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  // ── Table queries ───────────────────────────────────────────────────

  /** Get a specific data row by its service name text */
  rowByService(serviceName: string): Locator {
    return this.statusTable.getByRole('row', { name: serviceName });
  }

  /** Get a cell within a specific row */
  cellInRow(row: Locator, cellText: string): Locator {
    return row.getByRole('cell', { name: cellText });
  }

  /** All data rows (excludes the header row) */
  get dataRows(): Locator {
    return this.statusTable.locator('tbody tr');
  }
}
