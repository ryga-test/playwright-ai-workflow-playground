// @provenance runId=2026-05-09T135109Z approvedAt=2026-05-09T13:58:38.569Z gate=test-draft-review
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

test.describe('Automation in Testing public demo home page', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
  });

  test('Scenario 1 — Home page structure is visible', async () => {
    // Given — arrange: navigate to the public demo home page.
    await app.goto();

    // When — act: allow the page to finish loading by waiting for the main heading.
    await expect(app.pageHeading).toBeVisible();

    // Then — assert: primary page structure is visible.
    await expect(app.navigation).toBeVisible();
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.roomsHeading).toBeVisible();
    await expect(app.locationHeading).toBeVisible();
    await expect(app.contactInformationHeading).toBeVisible();
    await expect(app.contactFormHeading).toBeVisible();
    await expect(app.footer).toBeVisible();
  });

  test('Scenario 2 — Primary navigation links target public page sections', async () => {
    // Given — arrange: start on the public demo home page.
    await app.goto();

    // When — act: click public section links in the primary navigation.
    await app.openRoomsSection();
    await expect(app.roomsHeading).toBeVisible();
    await app.openBookingSection();
    await expect(app.availabilityHeading).toBeVisible();
    await app.openLocationSection();
    await expect(app.locationHeading).toBeVisible();
    await app.openContactSection();

    // Then — assert: each target section is available and the final contact target is visible.
    await expect(app.roomsHeading).toBeVisible();
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.locationHeading).toBeVisible();
    await expect(app.contactFormHeading).toBeVisible();
  });

  test('Scenario 3 — Header links expose expected destinations', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect header navigation links.
    await expect(app.navigation).toBeVisible();

    // Then — assert: header links expose expected href destinations.
    await expect(app.brandHomeLink).toHaveAttribute('href', '/');
    await expect(app.navRoomsLink).toHaveAttribute('href', '/#rooms');
    await expect(app.navBookingLink).toHaveAttribute('href', '/#booking');
    await expect(app.navAmenitiesLink).toHaveAttribute('href', '/#amenities');
    await expect(app.navLocationLink).toHaveAttribute('href', '/#location');
    await expect(app.navContactLink).toHaveAttribute('href', '/#contact');
    await expect(app.navAdminLink).toHaveAttribute('href', '/admin');
  });

  test('Scenario 4 — Hero Book Now link moves the user to booking availability', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: click the hero booking call to action.
    await app.heroBookNowLink.click();

    // Then — assert: the availability controls are visible.
    await expect(app.availabilityHeading).toBeVisible();
    await expect(app.checkInInput).toBeVisible();
    await expect(app.checkOutInput).toBeVisible();
    await expect(app.checkAvailabilityButton).toBeVisible();
  });

  test('Scenario 5 — Availability form starts with default stay dates', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the availability form.
    await expect(app.availabilityHeading).toBeVisible();

    // Then — assert: default stay dates and the action button are present.
    await expect(app.checkInInput).toHaveValue('09/05/2026');
    await expect(app.checkOutInput).toHaveValue('10/05/2026');
    await expect(app.checkAvailabilityButton).toBeEnabled();
  });

  test('Scenario 6 — User can edit availability dates without submitting a booking', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: edit the stay dates without continuing to a reservation.
    await app.setStayDates('15/05/2026', '16/05/2026');

    // Then — assert: edited values are retained and the user remains on the home page.
    await expect(app.checkInInput).toHaveValue('15/05/2026');
    await expect(app.checkOutInput).toHaveValue('16/05/2026');
    await expect(app.page).toHaveURL(/\/$/);
  });

  test('Scenario 7 — Room listings show known room types and prices', async ({ page }) => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the rooms section.
    await expect(app.roomsHeading).toBeVisible();

    // Then — assert: known room types and prices are visible.
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.suiteRoomHeading).toBeVisible();
    await expect(page.getByText('£100 per night')).toBeVisible();
    await expect(page.getByText('£150 per night')).toBeVisible();
    await expect(page.getByText('£225 per night')).toBeVisible();
  });

  test('Scenario 8 — Room booking links point to reservation pages without completing bookings', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect room booking links without clicking them.
    await expect(app.roomsHeading).toBeVisible();

    // Then — assert: booking links target reservation pages with stay-date query parameters.
    await expect(app.singleRoomBookNowLink).toHaveAttribute(
      'href',
      /\/reservation\/1\?checkin=2026-05-09&checkout=2026-05-10/,
    );
    await expect(app.doubleRoomBookNowLink).toHaveAttribute(
      'href',
      /\/reservation\/2\?checkin=2026-05-09&checkout=2026-05-10/,
    );
    await expect(app.suiteRoomBookNowLink).toHaveAttribute(
      'href',
      /\/reservation\/3\?checkin=2026-05-09&checkout=2026-05-10/,
    );
  });

  test('Scenario 9 — Map attribution links are present', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the location section.
    await expect(app.locationHeading).toBeVisible();

    // Then — assert: map attribution links are visible and target expected sites.
    await expect(app.pigeonMapAttributionLink).toBeVisible();
    await expect(app.pigeonMapAttributionLink).toHaveAttribute('href', 'https://pigeon-maps.js.org/');
    await expect(app.openStreetMapAttributionLink).toBeVisible();
    await expect(app.openStreetMapAttributionLink).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
  });

  test('Scenario 10 — Contact information content is visible', async ({ page }) => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the contact information section.
    await expect(app.contactInformationHeading).toBeVisible();

    // Then — assert: published contact content is visible.
    await expect(page.locator('#location').getByText(/Shady Meadows B&B.*Newingtonfordburyshire/)).toBeVisible();
    await expect(page.getByText('012345678901').first()).toBeVisible();
    await expect(page.getByText('fake@fakeemail.com').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Getting Here' })).toBeVisible();
  });

  test('Scenario 11 — Contact form starts empty and editable', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the contact form.
    await expect(app.contactFormHeading).toBeVisible();

    // Then — assert: fields are empty and submit is visible.
    await expect(app.contactNameInput).toHaveValue('');
    await expect(app.contactEmailInput).toHaveValue('');
    await expect(app.contactPhoneInput).toHaveValue('');
    await expect(app.contactSubjectInput).toHaveValue('');
    await expect(app.contactMessageInput).toHaveValue('');
    await expect(app.submitContactButton).toBeVisible();
  });

  test('Scenario 12 — User can fill contact form fields without submitting a message', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: fill contact fields without pressing Submit.
    await app.fillContactForm({
      name: 'Test User',
      email: 'test@example.test',
      phone: '01234567890',
      subject: 'Read-only smoke test',
      message: 'This message is not submitted by the first-run pipeline.',
    });

    // Then — assert: each entered value is retained on the current page.
    await expect(app.contactNameInput).toHaveValue('Test User');
    await expect(app.contactEmailInput).toHaveValue('test@example.test');
    await expect(app.contactPhoneInput).toHaveValue('01234567890');
    await expect(app.contactSubjectInput).toHaveValue('Read-only smoke test');
    await expect(app.contactMessageInput).toHaveValue('This message is not submitted by the first-run pipeline.');
    await expect(app.page).toHaveURL(/\/$/);
  });

  test('Scenario 13 — Contact form validation can be observed without sending a message', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect validation affordances without clicking Submit.
    await expect(app.contactFormHeading).toBeVisible();

    // Then — assert: Submit is present but no contact message is sent in this first-run smoke test.
    await expect(app.submitContactButton).toBeVisible();
    await expect(app.alertContainer).toBeAttached();
  });

  test('Scenario 14 — Footer quick links are visible and scoped to the footer', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the footer.
    await expect(app.footer).toBeVisible();

    // Then — assert: footer quick links and contact details are visible.
    await expect(app.footerHomeLink).toBeVisible();
    await expect(app.footerRoomsLink).toBeVisible();
    await expect(app.footerBookingLink).toBeVisible();
    await expect(app.footerContactLink).toBeVisible();
    await expect(app.footer).toContainText('Shady Meadows B&B, Shadows valley');
    await expect(app.footer).toContainText('012345678901');
    await expect(app.footer).toContainText('fake@fakeemail.com');
  });

  test('Scenario 15 — Footer policy and admin links expose expected destinations', async ({ page }) => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect footer policy and admin links.
    await expect(app.footer).toBeVisible();

    // Then — assert: footer destination links are correct.
    await expect(app.cookiePolicyLink).toHaveAttribute('href', '/cookie');
    await expect(app.privacyPolicyLink).toHaveAttribute('href', '/privacy');
    await expect(app.footerAdminPanelLink).toHaveAttribute('href', '/admin');
    await expect(page.getByRole('link', { name: 'Mark Winteringham' })).toHaveAttribute(
      'href',
      'http://www.mwtestconsultancy.co.uk',
    );
  });

  test('Scenario 16 — Admin link navigates to the public admin entry page only', async () => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: navigate to the public admin entry page without entering credentials.
    await app.openAdmin();

    // Then — assert: the browser reaches admin and no authenticated action is attempted.
    await expect(app.page).toHaveURL(/\/admin\/?$/);
  });

  test('Scenario 17 — No table content is present in the discovered public home page', async ({ page }) => {
    // Given — arrange: open the public demo home page.
    await app.goto();

    // When — act: inspect the discovered public home page for tables.
    await expect(app.pageHeading).toBeVisible();

    // Then — assert: table content is not applicable for this public home page.
    await expect(page.getByRole('table')).toHaveCount(0);
  });
});
