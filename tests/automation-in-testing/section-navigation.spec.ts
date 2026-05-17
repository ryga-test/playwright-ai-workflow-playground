// @provenance runId=2026-05-17T100540Z approvedAt=2026-05-17T10:05:40Z gate=test-draft-review sourceFlow=apps/automation-in-testing/flows/section-navigation.yaml sourceFeature=tests/automation-in-testing/section-navigation.feature
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @section-navigation';

test.describe('Flow: section-navigation', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/');
  });

  test(`Visitor navigates to a public page section — Rooms ${tags}`, async () => {
    // Then the visitor sees the "Our Rooms" section content
    await app.openRoomsSection();
    await expect(app.roomsHeading).toBeVisible();
  });

  test(`Visitor navigates to a public page section — Booking ${tags}`, async () => {
    // Then the visitor sees the "Check Availability & Book Your Stay" section content
    await app.openBookingSection();
    await expect(app.availabilityHeading).toBeVisible();
  });

  test(`Visitor navigates to a public page section — Location ${tags}`, async () => {
    // Then the visitor sees the "Our Location" section content
    await app.openLocationSection();
    await expect(app.locationHeading).toBeVisible();
  });

  test(`Visitor navigates to a public page section — Contact ${tags}`, async () => {
    // Then the visitor sees the "Contact Information" section content
    await app.openContactSection();
    await expect(app.contactInformationHeading).toBeVisible();
  });

  test(`Visitor starts from the hero booking call to action ${tags}`, async () => {
    // Then the visitor sees the availability search area
    await app.heroBookNowLink.click();
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.checkInInput).toBeVisible();
    await expect(app.checkOutInput).toBeVisible();
    await expect(app.checkAvailabilityButton).toBeVisible();
  });
});
