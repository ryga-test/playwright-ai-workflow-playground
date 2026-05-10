// @provenance source=apps/automation-in-testing/flows/section-navigation.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @section-navigation';

test.describe('Flow: section-navigation', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor navigates to public page sections — Rooms ${tags}`, async () => {
    await app.openRoomsSection();
    await expect(app.roomsHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Booking ${tags}`, async () => {
    await app.openBookingSection();
    await expect(app.availabilityHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Location ${tags}`, async () => {
    await app.openLocationSection();
    await expect(app.locationHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Contact ${tags}`, async () => {
    await app.openContactSection();
    await expect(app.contactInformationHeading).toBeVisible();
  });

  test(`Visitor starts from the hero booking call to action ${tags}`, async () => {
    await app.heroBookNowLink.click();
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.checkInInput).toBeVisible();
    await expect(app.checkOutInput).toBeVisible();
    await expect(app.checkAvailabilityButton).toBeVisible();
  });
});
