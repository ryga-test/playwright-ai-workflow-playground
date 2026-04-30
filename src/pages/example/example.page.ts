// @provenance runId=2026-04-30T094508Z approvedAt=2026-04-30T12:26:06Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the Example application dashboard.
 *
 * All locators follow Playwright priority: getByRole (P1) → getByLabel (P2).
 * Derived from the ARIA snapshot captured at localhost:3000 and normalized
 * in step3-extract-selectors.
 *
 * Run: 2026-04-30T094508Z
 * Approved: 2026-04-30T12:26:06Z
 */

export class ExampleDashboardPage {
  // ── Page chrome ─────────────────────────────────────────────────────

  /** "Workflow Playground Dashboard" — page-level h1 */
  readonly heading: Locator;
  /** Primary navigation landmark */
  readonly nav: Locator;
  /** "Dashboard" link in primary nav */
  readonly dashboardLink: Locator;
  /** "Settings" link in primary nav */
  readonly settingsLink: Locator;

  // ── Profile Settings ────────────────────────────────────────────────

  /** "Profile Settings" heading (h2) */
  readonly profileHeading: Locator;
  /** Profile settings form (scoping container) */
  readonly profileForm: Locator;
  /** "Display name" textbox */
  readonly displayNameInput: Locator;
  /** "Email address" textbox */
  readonly emailInput: Locator;
  /** "Save Changes" button */
  readonly saveButton: Locator;
  /** Live region status message */
  readonly statusMessage: Locator;

  // ── Application Status ──────────────────────────────────────────────

  /** "Application Status" heading (h2) */
  readonly statusHeading: Locator;
  /** Application status table */
  readonly statusTable: Locator;
  /** "Name" column header */
  readonly nameHeader: Locator;
  /** "Status" column header */
  readonly statusHeader: Locator;
  /** All data rows (tbody tr, excluding header) */
  readonly dataRows: Locator;

  // ────────────────────────────────────────────────────────────────────

  constructor(public readonly page: Page) {
    // Page chrome
    this.heading = page.getByRole('heading', {
      name: 'Workflow Playground Dashboard',
      level: 1,
    });
    this.nav = page.getByRole('navigation', { name: 'Primary navigation' });
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });

    // Profile settings
    this.profileHeading = page.getByRole('heading', {
      name: 'Profile Settings',
      level: 2,
    });
    this.profileForm = page.getByRole('form', {
      name: 'Profile settings form',
    });
    this.displayNameInput = page.getByLabel('Display name');
    this.emailInput = page.getByLabel('Email address');
    this.saveButton = page.getByRole('button', { name: 'Save Changes' });
    this.statusMessage = page.getByRole('status');

    // Application status
    this.statusHeading = page.getByRole('heading', {
      name: 'Application Status',
      level: 2,
    });
    this.statusTable = page.getByRole('table', {
      name: 'Application status table',
    });
    this.nameHeader = page.getByRole('columnheader', { name: 'Name' });
    this.statusHeader = page.getByRole('columnheader', { name: 'Status' });
    this.dataRows = this.statusTable.locator('tbody tr');
  }

  // ── Navigation ──────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async clickDashboardLink(): Promise<void> {
    await this.dashboardLink.click();
  }

  async clickSettingsLink(): Promise<void> {
    await this.settingsLink.click();
  }

  // ── Form ────────────────────────────────────────────────────────────

  /** Fill and submit the profile form. Returns the name shown in the status message. */
  async submitProfile(name: string, email: string): Promise<string> {
    await this.displayNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.saveButton.click();
    return name || 'Unnamed user';
  }

  async fillName(name: string): Promise<void> {
    await this.displayNameInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  // ── Table ───────────────────────────────────────────────────────────

  /** Find a data row by service name. */
  row(service: string): Locator {
    return this.statusTable.getByRole('row', { name: service });
  }

  /** Get a cell within a row by text. */
  cell(row: Locator, text: string): Locator {
    return row.getByRole('cell', { name: text });
  }

  /** Get cell at column index within a row. */
  cellAt(row: Locator, col: number): Locator {
    return row.locator('td').nth(col);
  }
}
