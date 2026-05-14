// @provenance runId=2026-05-14T130209Z approvedAt=2026-05-14T13:25:00.000Z gate=test-draft-review source=tests/automation-in-testing/location-contact-info.feature flow=apps/automation-in-testing/flows/location-contact-info.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @location-contact-info';

test.describe('Flow: location-contact-info', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    // Background: Given the visitor opens the public home page / When the visitor navigates to the location section
    await app.goto('/#location');
  });

  // @scenario Location section displays map attribution and contact details
  test(`Location section displays map attribution and contact details ${tags}`, async () => {
    // Then the visitor sees the "Our Location" heading
    await expect(app.locationHeading).toBeVisible();

    // Then the visitor sees a map attribution link for "Pigeon"
    // Then the visitor sees a map attribution link for "OpenStreetMap"
    await expect(app.pigeonMapAttributionLink).toBeVisible();
    await expect(app.openStreetMapAttributionLink).toBeVisible();

    // Then the visitor sees the "Contact Information" heading
    await expect(app.contactInformationHeading).toBeVisible();

    // Then the visitor sees the address / phone / email
    // All contact detail assertions scoped to #location per R05
    await expect(app.locationAddressText).toBeVisible();
    await expect(app.locationPhoneText).toBeVisible();
    await expect(app.locationEmailText).toBeVisible();
  });
});
