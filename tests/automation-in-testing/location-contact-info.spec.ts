// @provenance source=apps/automation-in-testing/flows/location-contact-info.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @location-contact-info';

test.describe('Flow: location-contact-info', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor sees public location and contact information ${tags}`, async ({ page }) => {
    await expect(app.locationHeading).toBeVisible();
    await expect(app.pigeonMapAttributionLink).toBeVisible();
    await expect(app.openStreetMapAttributionLink).toBeVisible();
    await expect(app.contactInformationHeading).toBeVisible();
    await expect(page.locator('#location').getByText(/Shady Meadows B&B.*Newingtonfordburyshire/)).toBeVisible();
    await expect(page.getByText('012345678901').first()).toBeVisible();
    await expect(page.getByText('fake@fakeemail.com').first()).toBeVisible();
  });
});
