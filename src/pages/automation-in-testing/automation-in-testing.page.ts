// @provenance runId=2026-05-09T135109Z approvedAt=2026-05-09T13:55:36.908Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

/**
 * Draft page object for the Automation in Testing public demo home page.
 *
 * Generated from:
 * results/automation-in-testing/2026-05-09T135109Z/step3-extract-selectors/normalized-selectors.md
 *
 * Selector strategy: prefer accessible Playwright locators in priority order
 * getByRole > getByTestId > getByLabel > getByPlaceholder > getByText > CSS/XPath.
 */
export class AutomationInTestingPage {
  readonly navigation: Locator;
  readonly pageHeading: Locator;
  readonly brandHomeLink: Locator;
  readonly navRoomsLink: Locator;
  readonly navBookingLink: Locator;
  readonly navAmenitiesLink: Locator;
  readonly navLocationLink: Locator;
  readonly navContactLink: Locator;
  readonly navAdminLink: Locator;

  readonly heroBookNowLink: Locator;
  readonly availabilityHeading: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly checkAvailabilityButton: Locator;

  readonly roomsHeading: Locator;
  readonly singleRoomHeading: Locator;
  readonly doubleRoomHeading: Locator;
  readonly suiteRoomHeading: Locator;
  readonly singleRoomBookNowLink: Locator;
  readonly doubleRoomBookNowLink: Locator;
  readonly suiteRoomBookNowLink: Locator;

  readonly locationHeading: Locator;
  readonly pigeonMapAttributionLink: Locator;
  readonly openStreetMapAttributionLink: Locator;

  readonly contactInformationHeading: Locator;
  readonly contactFormHeading: Locator;
  readonly contactNameInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactPhoneInput: Locator;
  readonly contactSubjectInput: Locator;
  readonly contactMessageInput: Locator;
  readonly submitContactButton: Locator;
  readonly alertContainer: Locator;

  readonly footer: Locator;
  readonly footerHomeLink: Locator;
  readonly footerRoomsLink: Locator;
  readonly footerBookingLink: Locator;
  readonly footerContactLink: Locator;
  readonly cookiePolicyLink: Locator;
  readonly privacyPolicyLink: Locator;
  readonly footerAdminPanelLink: Locator;

  constructor(readonly page: Page) {
    this.navigation = page.getByRole('navigation');
    this.pageHeading = page.getByRole('heading', {
      name: 'Welcome to Shady Meadows B&B',
      level: 1,
    });
    this.brandHomeLink = page.getByRole('link', { name: 'Shady Meadows B&B' });
    this.navRoomsLink = this.navigation.getByRole('link', { name: 'Rooms' });
    this.navBookingLink = this.navigation.getByRole('link', { name: 'Booking' });
    this.navAmenitiesLink = this.navigation.getByRole('link', { name: 'Amenities' });
    this.navLocationLink = this.navigation.getByRole('link', { name: 'Location' });
    this.navContactLink = this.navigation.getByRole('link', { name: 'Contact' });
    this.navAdminLink = this.navigation.getByRole('link', { name: 'Admin' });

    this.heroBookNowLink = page.getByRole('link', { name: 'Book Now', exact: true });
    this.availabilityHeading = page.getByRole('heading', {
      name: 'Check Availability & Book Your Stay',
      level: 3,
    });
    this.checkInInput = page.getByRole('textbox').nth(0);
    this.checkOutInput = page.getByRole('textbox').nth(1);
    this.checkAvailabilityButton = page.getByRole('button', {
      name: 'Check Availability',
    });

    this.roomsHeading = page.getByRole('heading', { name: 'Our Rooms', level: 2 });
    this.singleRoomHeading = page.getByRole('heading', { name: 'Single', level: 5 });
    this.doubleRoomHeading = page.getByRole('heading', { name: 'Double', level: 5 });
    this.suiteRoomHeading = page.getByRole('heading', { name: 'Suite', level: 5 });
    this.singleRoomBookNowLink = page.getByRole('link', { name: 'Book now', exact: true }).nth(0);
    this.doubleRoomBookNowLink = page.getByRole('link', { name: 'Book now', exact: true }).nth(1);
    this.suiteRoomBookNowLink = page.getByRole('link', { name: 'Book now', exact: true }).nth(2);

    this.locationHeading = page.getByRole('heading', { name: 'Our Location', level: 2 });
    this.pigeonMapAttributionLink = page.getByRole('link', { name: 'Pigeon' });
    this.openStreetMapAttributionLink = page.getByRole('link', { name: 'OpenStreetMap' });

    this.contactInformationHeading = page.getByRole('heading', {
      name: 'Contact Information',
      level: 3,
    });
    this.contactFormHeading = page.getByRole('heading', {
      name: 'Send Us a Message',
      level: 3,
    });
    this.contactNameInput = page.getByRole('textbox', { name: 'Name' });
    this.contactEmailInput = page.getByRole('textbox', { name: 'Email' });
    this.contactPhoneInput = page.getByRole('textbox', { name: 'Phone' });
    this.contactSubjectInput = page.getByRole('textbox', { name: 'Subject' });
    this.contactMessageInput = page.locator('#description');
    this.submitContactButton = page.getByRole('button', { name: 'Submit' });
    this.alertContainer = page.getByRole('alert');

    this.footer = page.getByRole('contentinfo');
    this.footerHomeLink = this.footer.getByRole('link', { name: 'Home' });
    this.footerRoomsLink = this.footer.getByRole('link', { name: 'Rooms' });
    this.footerBookingLink = this.footer.getByRole('link', { name: 'Booking' });
    this.footerContactLink = this.footer.getByRole('link', { name: 'Contact' });
    this.cookiePolicyLink = page.getByRole('link', { name: 'Cookie-Policy' });
    this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy-Policy' });
    this.footerAdminPanelLink = page.getByRole('link', { name: 'Admin panel' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openRoomsSection(): Promise<void> {
    await this.navRoomsLink.click();
  }

  async openBookingSection(): Promise<void> {
    await this.navBookingLink.click();
  }

  async openLocationSection(): Promise<void> {
    await this.navLocationLink.click();
  }

  async openContactSection(): Promise<void> {
    await this.navContactLink.click();
  }

  async openAdmin(): Promise<void> {
    await this.navAdminLink.click();
  }

  async setStayDates(checkIn: string, checkOut: string): Promise<void> {
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
  }

  async fillContactForm(contact: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }): Promise<void> {
    await this.contactNameInput.fill(contact.name);
    await this.contactEmailInput.fill(contact.email);
    await this.contactPhoneInput.fill(contact.phone);
    await this.contactSubjectInput.fill(contact.subject);
    await this.contactMessageInput.fill(contact.message);
  }
}
