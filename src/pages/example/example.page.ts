// @provenance runId=2026-05-02T061759Z approvedAt=2026-05-02T00:00:00.000Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the Example application dashboard.
 *
 * Selectors are derived from the normalized selector artifact for run
 * 2026-05-02T061759Z. The class favors accessible Playwright locators:
 * getByRole for semantic regions, links, buttons, tables, and status;
 * getByLabel for labelled form controls.
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
    this.displayNameInput = page.getByLabel('Display name');
    this.emailAddressInput = page.getByLabel('Email address');
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
