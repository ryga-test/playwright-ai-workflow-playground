// @provenance runId=2026-05-03T021118Z approvedAt=2026-05-03T00:00:00.000Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the Example application dashboard.
 *
 * Generated from:
 * results/example/2026-05-03T021118Z/step3-extract-selectors/normalized-selectors.md
 *
 * Selector strategy: prefer accessible Playwright locators in priority order
 * getByRole > getByTestId > getByLabel > getByPlaceholder > getByText > CSS/XPath.
 */
export class ExamplePage {
  readonly pageHeading: Locator;
  readonly primaryNavigation: Locator;
  readonly dashboardLink: Locator;
  readonly settingsLink: Locator;
  readonly profileSettingsRegion: Locator;
  readonly applicationStatusRegion: Locator;

  readonly profileSettingsForm: Locator;
  readonly displayNameInput: Locator;
  readonly emailAddressInput: Locator;
  readonly saveChangesButton: Locator;
  readonly statusMessage: Locator;

  readonly applicationStatusTable: Locator;
  readonly nameColumnHeader: Locator;
  readonly statusColumnHeader: Locator;

  constructor(readonly page: Page) {
    this.pageHeading = page.getByRole('heading', {
      name: 'Workflow Playground Dashboard',
      level: 1,
    });
    this.primaryNavigation = page.getByRole('navigation', {
      name: 'Primary navigation',
    });
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });
    this.profileSettingsRegion = page.getByRole('region', {
      name: 'Profile Settings',
    });
    this.applicationStatusRegion = page.getByRole('region', {
      name: 'Application Status',
    });

    this.profileSettingsForm = page.getByRole('form', {
      name: 'Profile settings form',
    });
    this.displayNameInput = page.getByRole('textbox', { name: 'Display name' });
    this.emailAddressInput = page.getByRole('textbox', { name: 'Email address' });
    this.saveChangesButton = page.getByRole('button', {
      name: 'Save Changes',
    });
    this.statusMessage = page.getByRole('status');

    this.applicationStatusTable = page.getByRole('table', {
      name: 'Application status table',
    });
    this.nameColumnHeader = page.getByRole('columnheader', { name: 'Name' });
    this.statusColumnHeader = page.getByRole('columnheader', { name: 'Status' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openDashboardSection(): Promise<void> {
    await this.dashboardLink.click();
  }

  async openSettingsSection(): Promise<void> {
    await this.settingsLink.click();
  }

  async fillProfile(displayName: string, emailAddress: string): Promise<void> {
    await this.displayNameInput.fill(displayName);
    await this.emailAddressInput.fill(emailAddress);
  }

  async saveProfile(): Promise<void> {
    await this.saveChangesButton.click();
  }

  async updateProfile(displayName: string, emailAddress: string): Promise<void> {
    await this.fillProfile(displayName, emailAddress);
    await this.saveProfile();
  }

  statusRow(serviceName: string, status: string): Locator {
    return this.applicationStatusTable.getByRole('row', {
      name: `${serviceName} ${status}`,
    });
  }

  statusCell(name: string): Locator {
    return this.applicationStatusTable.getByRole('cell', { name });
  }
}
