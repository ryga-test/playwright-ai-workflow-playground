// @provenance runId=2026-05-10T004617Z approvedAt=2026-05-10T00:50:04Z gate=test-draft-review source=tests/automation-in-testing/automation-in-testing.feature
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only';

test.describe('Feature: Public bed and breakfast home page', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor sees the public home page introduction ${tags}`, async () => {
    // Source scenario: Visitor sees the public home page introduction
    await expect(app.pageHeading).toBeVisible();
    await expect(app.brandHomeLink).toBeVisible();
    await expect(app.navigation).toBeVisible();
    await expect(app.navRoomsLink).toBeVisible();
    await expect(app.navBookingLink).toBeVisible();
    await expect(app.navAmenitiesLink).toBeVisible();
    await expect(app.navLocationLink).toBeVisible();
    await expect(app.navContactLink).toBeVisible();
    await expect(app.navAdminLink).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Rooms ${tags}`, async () => {
    // Source scenario outline: Visitor navigates to public page sections | section=Rooms | expectedHeading=Our Rooms
    await app.openRoomsSection();
    await expect(app.roomsHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Booking ${tags}`, async () => {
    // Source scenario outline: Visitor navigates to public page sections | section=Booking | expectedHeading=Check Availability & Book Your Stay
    await app.openBookingSection();
    await expect(app.availabilityHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Location ${tags}`, async () => {
    // Source scenario outline: Visitor navigates to public page sections | section=Location | expectedHeading=Our Location
    await app.openLocationSection();
    await expect(app.locationHeading).toBeVisible();
  });

  test(`Visitor navigates to public page sections — Contact ${tags}`, async () => {
    // Source scenario outline: Visitor navigates to public page sections | section=Contact | expectedHeading=Contact Information
    await app.openContactSection();
    await expect(app.contactInformationHeading).toBeVisible();
  });

  test(`Visitor starts from the hero booking call to action ${tags}`, async () => {
    // Source scenario: Visitor starts from the hero booking call to action
    await app.heroBookNowLink.click();
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.checkInInput).toBeVisible();
    await expect(app.checkOutInput).toBeVisible();
    await expect(app.checkAvailabilityButton).toBeVisible();
  });

  test(`Visitor checks room availability for selected dates ${tags}`, async () => {
    // Source scenario: Visitor checks room availability for selected dates
    await app.checkAvailability('10/05/2026', '11/05/2026');
    await expect(app.singleRoomBookNowLink).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();
    await expect(app.page).not.toHaveURL(/\/reservation\//);
  });

  test(`Visitor sees each public room type — Single ${tags}`, async () => {
    // Source scenario outline: Visitor sees each public room type | roomType=Single
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.singleRoomBookNowLink).toBeVisible();
  });

  test(`Visitor sees each public room type — Double ${tags}`, async () => {
    // Source scenario outline: Visitor sees each public room type | roomType=Double
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
  });

  test(`Visitor sees each public room type — Suite ${tags}`, async () => {
    // Source scenario outline: Visitor sees each public room type | roomType=Suite
    await expect(app.suiteRoomHeading).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();
  });

  test(`Visitor can prepare a contact message without sending it ${tags}`, async () => {
    // Source scenario: Visitor can prepare a contact message without sending it
    const message = {
      name: 'Read Only Visitor',
      email: 'readonly@example.test',
      phone: '01234567890',
      subject: 'Read-only smoke test',
      message: 'This contact message is prepared by an automated read-only smoke test and is not submitted.',
    };

    await app.fillContactForm(message);

    await expect(app.contactNameInput).toHaveValue(message.name);
    await expect(app.contactEmailInput).toHaveValue(message.email);
    await expect(app.contactPhoneInput).toHaveValue(message.phone);
    await expect(app.contactSubjectInput).toHaveValue(message.subject);
    await expect(app.contactMessageInput).toHaveValue(message.message);
    await expect(app.submitContactButton).toBeVisible();
    await expect(app.submitContactButton).toBeEnabled();
  });

  test(`Visitor sees public location and contact information ${tags}`, async ({ page }) => {
    // Source scenario: Visitor sees public location and contact information
    await expect(app.locationHeading).toBeVisible();
    await expect(app.pigeonMapAttributionLink).toBeVisible();
    await expect(app.openStreetMapAttributionLink).toBeVisible();
    await expect(app.contactInformationHeading).toBeVisible();
    await expect(page.locator('#location').getByText(/Shady Meadows B&B.*Newingtonfordburyshire/)).toBeVisible();
    await expect(page.getByText('012345678901').first()).toBeVisible();
    await expect(page.getByText('fake@fakeemail.com').first()).toBeVisible();
  });

  test(`Visitor can access public policy links ${tags}`, async () => {
    // Source scenario: Visitor can access public policy links
    await expect(app.cookiePolicyLink).toBeVisible();
    await expect(app.cookiePolicyLink).toHaveAttribute('href', '/cookie');
    await expect(app.privacyPolicyLink).toBeVisible();
    await expect(app.privacyPolicyLink).toHaveAttribute('href', '/privacy');
  });
});
