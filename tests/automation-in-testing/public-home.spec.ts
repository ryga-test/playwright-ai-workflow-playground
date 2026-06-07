// @provenance runId=2026-06-07T010736Z approvedAt=2026-06-07T01:12:00Z gate=test-draft-review source=tests/automation-in-testing/public-home.feature

import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '../../src/pages/automation-in-testing/automation-in-testing.page.js';

test.describe('Public home', () => {
  let page: AutomationInTestingPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new AutomationInTestingPage(playwrightPage);
    await page.goto('/');
  });

  test('Visitor sees the welcome heading', async () => {
    // Scenario: Visitor sees the welcome heading
    // Then the welcome heading "Welcome to Shady Meadows B&B" is visible
    await expect(page.welcomeHeading).toBeVisible();
  });

  test('Visitor sees public navigation options', async () => {
    // Scenario: Visitor sees public navigation options
    // Then the following navigation links are visible:
    //   | link     |
    //   | Rooms    |
    //   | Booking  |
    //   | Amenities|
    //   | Location |
    //   | Contact  |
    const navLinks = page.publicNavLinks();
    for (const link of navLinks) {
      await expect(link).toBeVisible();
    }
  });

  test('Visitor sees the brand logo link', async () => {
    // Scenario: Visitor sees the brand logo link
    // Then the brand logo link "Shady Meadows B&B" is visible
    await expect(page.brandLink).toBeVisible();
  });
});
