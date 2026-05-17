// @provenance runId=2026-05-17T155137Z approvedAt=2026-05-17T15:56:16Z gate=page-object-review sourceFlow=apps/automation-in-testing/flows/room-search.yaml
// @provenance runId=2026-05-17T100540Z approvedAt=2026-05-17T10:05:40.000Z gate=page-object-review sourceFlow=apps/automation-in-testing/flows/section-navigation.yaml
// @provenance runId=2026-05-17T120959Z approvedAt=2026-05-17T12:12:49.451Z gate=page-object-review sourceFlow=apps/automation-in-testing/flows/public-home.yaml
// @provenance runId=2026-05-17T142233Z approvedAt=2026-05-17T14:28:54+00:00 gate=page-object-review sourceFlow=apps/automation-in-testing/flows/public-home.yaml
import { expect, type Locator, type Page } from '@playwright/test';

const ROOM_SEARCH_EXPECTED_ROOM_HREFS = {
  single: '/reservation/1?checkin=2026-05-24&checkout=2026-05-25',
  double: '/reservation/2?checkin=2026-05-24&checkout=2026-05-25',
  suite: '/reservation/3?checkin=2026-05-24&checkout=2026-05-25',
} as const;

export const POLICY_LINK_HREFS = {
  cookie: '/cookie',
  privacy: '/privacy',
} as const;

export type ContactMessageDraft = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

/**
 * Shared page object for the Automation in Testing public demo app.
 *
 * Approved provenance:
 * - runId: 2026-05-17T100540Z
 * - flowId: section-navigation
 * - source flow: apps/automation-in-testing/flows/section-navigation.yaml
 * - normalized selectors: results/automation-in-testing/flows/section-navigation/2026-05-17T100540Z/step3-extract-selectors/normalized-selectors.md
 * - discovery paths: / (home)
 *
 * - runId: 2026-05-17T120959Z
 * - flowId: public-home
 * - source flow: apps/automation-in-testing/flows/public-home.yaml
 * - normalized selectors: results/automation-in-testing/flows/public-home/2026-05-17T120959Z/step3-extract-selectors/normalized-selectors.md
 * - discovery paths: / (home)
 *
 * - runId: 2026-05-17T142233Z
 * - flowId: public-home
 * - source flow: apps/automation-in-testing/flows/public-home.yaml
 * - normalized selectors: results/automation-in-testing/flows/public-home/2026-05-17T142233Z/step3-extract-selectors/normalized-selectors.md
 * - discovery paths: / (home)
 *
 * Inherited selectors (approved in prior runs):
 * - room-search (2026-05-17T094218Z): booking section, date inputs, room options, availability button.
 * - contact-message, policy-links, location-contact-info, room-display: prior approved locators preserved.
 *
 * Selected flow coverage (this run):
 * - public-home: verify a public visitor can see the welcome heading and public navigation options.
 * - All selectors are read-only (navigate + assert only).
 *
 * Safety notes:
 * - This flow is read-only and allows navigate and assert actions only.
 * - Do not click Admin link; admin navigation is out of scope.
 * - Do not click Book Now/Book now links; checkout/reservation is out of scope.
 * - Do not click Check Availability; booking is forbidden.
 * - Assert heading visibility (rule R06).
 * - All public-home selectors are P1 getByRole.
 */
export class AutomationInTestingPage {
  readonly navigation: Locator;
  readonly pageHeading: Locator;
  readonly mainHeading: Locator;
  readonly welcomeHeading: Locator;
  readonly brandHomeLink: Locator;
  readonly brandLink: Locator;
  readonly navRoomsLink: Locator;
  readonly navBookingLink: Locator;
  readonly navAmenitiesLink: Locator;
  readonly navLocationLink: Locator;
  readonly navContactLink: Locator;
  readonly contactNavLink: Locator;
  readonly navAdminLink: Locator;

  readonly heroBookNowLink: Locator;
  readonly bookingSection: Locator;
  readonly availabilityHeading: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly checkAvailabilityButton: Locator;

  readonly roomsHeading: Locator;
  readonly singleRoomHeading: Locator;
  readonly doubleRoomHeading: Locator;
  readonly suiteRoomHeading: Locator;
  readonly roomBookNowLinks: Locator;
  readonly singleRoomBookNowLink: Locator;
  readonly doubleRoomBookNowLink: Locator;
  readonly suiteRoomBookNowLink: Locator;

  readonly locationHeading: Locator;
  readonly pigeonMapAttributionLink: Locator;
  readonly openStreetMapAttributionLink: Locator;

  readonly locationSection: Locator;
  readonly locationAddressLabel: Locator;
  readonly locationAddressText: Locator;
  readonly locationPhoneLabel: Locator;
  readonly locationPhoneText: Locator;
  readonly locationEmailLabel: Locator;
  readonly locationEmailText: Locator;

  readonly contactInformationHeading: Locator;
  readonly contactInfoHeading: Locator;
  readonly contactFormHeading: Locator;
  readonly contactSectionHeading: Locator;
  readonly contactNameInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactPhoneInput: Locator;
  readonly contactSubjectInput: Locator;
  readonly contactMessageInput: Locator;
  readonly submitContactButton: Locator;
  readonly contactSubmitButton: Locator;
  readonly alertContainer: Locator;
  readonly alertRegion: Locator;

  readonly footer: Locator;
  readonly footerHomeLink: Locator;
  readonly footerRoomsLink: Locator;
  readonly footerBookingLink: Locator;
  readonly footerContactLink: Locator;
  readonly footerAuthorLink: Locator;
  readonly cookiePolicyLink: Locator;
  readonly privacyPolicyLink: Locator;
  readonly footerAdminPanelLink: Locator;

  constructor(readonly page: Page) {
    this.navigation = page.getByRole('navigation');
    this.pageHeading = page.getByRole('heading', {
      name: 'Welcome to Shady Meadows B&B',
      level: 1,
    });
    this.mainHeading = this.pageHeading;
    this.welcomeHeading = this.pageHeading;
    this.brandHomeLink = page.getByRole('link', { name: 'Shady Meadows B&B' });
    this.brandLink = this.brandHomeLink;
    // Provenance: flow=section-navigation path=/ selector-priority=P1 getByRole navigation-scoped.
    this.navRoomsLink = this.navigation.getByRole('link', { name: 'Rooms' });
    this.navBookingLink = this.navigation.getByRole('link', { name: 'Booking' });
    this.navAmenitiesLink = this.navigation.getByRole('link', { name: 'Amenities' });
    this.navLocationLink = this.navigation.getByRole('link', { name: 'Location' });
    this.navContactLink = this.navigation.getByRole('link', { name: 'Contact' });
    this.contactNavLink = this.navContactLink;
    this.navAdminLink = this.navigation.getByRole('link', { name: 'Admin' });

    // Provenance: flow=section-navigation path=/ selector-priority=P1 getByRole exact for hero.
    this.heroBookNowLink = page.getByRole('link', { name: 'Book Now', exact: true });

    // Provenance: inherited from flow=room-search path=/#booking.
    this.bookingSection = page.locator('section#booking');
    this.availabilityHeading = page.getByRole('heading', {
      name: 'Check Availability & Book Your Stay',
      level: 3,
    });
    this.checkInInput = this.bookingSection.locator('input').nth(0);
    this.checkOutInput = this.bookingSection.locator('input').nth(1);
    this.checkAvailabilityButton = page.getByRole('button', {
      name: 'Check Availability',
    });

    // Provenance: flow=section-navigation path=/ selector-priority=P1 getByRole.
    this.roomsHeading = page.getByRole('heading', { name: 'Our Rooms', level: 2 });
    this.singleRoomHeading = page.getByRole('heading', { name: 'Single', level: 5 });
    this.doubleRoomHeading = page.getByRole('heading', { name: 'Double', level: 5 });
    this.suiteRoomHeading = page.getByRole('heading', { name: 'Suite', level: 5 });
    this.roomBookNowLinks = page.getByRole('link', { name: 'Book now', exact: true });
    this.singleRoomBookNowLink = this.roomBookNowLinks.nth(0);
    this.doubleRoomBookNowLink = this.roomBookNowLinks.nth(1);
    this.suiteRoomBookNowLink = this.roomBookNowLinks.nth(2);

    // Provenance: flow=section-navigation path=/ selector-priority=P1 getByRole.
    this.locationHeading = page.getByRole('heading', { name: 'Our Location', level: 2 });
    this.pigeonMapAttributionLink = page.locator('#location').getByRole('link', { name: 'Pigeon' });
    this.openStreetMapAttributionLink = page.locator('#location').getByRole('link', { name: 'OpenStreetMap' });

    this.locationSection = page.locator('#location');
    this.locationAddressLabel = this.locationSection.getByRole('heading', { name: 'Address', level: 5 });
    this.locationAddressText = this.locationSection.getByText('Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA');
    this.locationPhoneLabel = this.locationSection.getByRole('heading', { name: 'Phone', level: 5 });
    this.locationPhoneText = this.locationSection.getByText('012345678901');
    this.locationEmailLabel = this.locationSection.getByRole('heading', { name: 'Email', level: 5 });
    this.locationEmailText = this.locationSection.getByText('fake@fakeemail.com');

    // Provenance: flow=section-navigation path=/ selector-priority=P1 getByRole.
    this.contactInformationHeading = page.getByRole('heading', {
      name: 'Contact Information',
      level: 3,
    });
    this.contactInfoHeading = this.contactInformationHeading;
    this.contactFormHeading = page.getByRole('heading', {
      name: 'Send Us a Message',
      level: 3,
    });
    this.contactSectionHeading = this.contactFormHeading;
    this.contactNameInput = page.getByTestId('ContactName');
    this.contactEmailInput = page.getByTestId('ContactEmail');
    this.contactPhoneInput = page.getByTestId('ContactPhone');
    this.contactSubjectInput = page.getByTestId('ContactSubject');
    this.contactMessageInput = page.getByTestId('ContactDescription');
    this.submitContactButton = page.getByRole('button', { name: 'Submit' });
    this.contactSubmitButton = this.submitContactButton;
    this.alertContainer = page.getByRole('alert');
    this.alertRegion = this.alertContainer;

    this.footer = page.getByRole('contentinfo');
    this.footerHomeLink = this.footer.getByRole('link', { name: 'Home' });
    this.footerRoomsLink = this.footer.getByRole('link', { name: 'Rooms' });
    this.footerBookingLink = this.footer.getByRole('link', { name: 'Booking' });
    this.footerContactLink = this.footer.getByRole('link', { name: 'Contact' });
    this.footerAuthorLink = page.getByRole('link', { name: 'Mark Winteringham' });
    this.cookiePolicyLink = this.footer.getByRole('link', { name: 'Cookie-Policy' });
    this.privacyPolicyLink = this.footer.getByRole('link', { name: 'Privacy-Policy' });
    this.footerAdminPanelLink = page.getByRole('link', { name: 'Admin panel' });
  }

  async goto(path = '/#booking'): Promise<void> {
    await this.page.goto(path);
  }

  async openRoomsSection(): Promise<void> {
    await this.navRoomsLink.click();
  }

  async openBookingSection(): Promise<void> {
    await this.navBookingLink.click();
  }

  // fallow-ignore-next-line unused-class-member
  async openAmenitiesSection(): Promise<void> {
    await this.navAmenitiesLink.click();
  }

  async openLocationSection(): Promise<void> {
    await this.navLocationLink.click();
  }

  async openContactSection(): Promise<void> {
    await this.navContactLink.click();
  }

  /** All public navigation links in display order. */
  publicNavLinks(): Locator[] {
    return [
      this.navRoomsLink,
      this.navBookingLink,
      this.navAmenitiesLink,
      this.navLocationLink,
      this.navContactLink,
    ];
  }

  /** Assert the selected flow goals for the public-home smoke path. */
  // fallow-ignore-next-line unused-class-member
  async expectPublicHomeVisible(): Promise<void> {
    await expect(this.pageHeading).toBeVisible();
    for (const link of this.publicNavLinks()) {
      await expect(link).toBeVisible();
    }
  }

  async setStayDates(checkIn: string, checkOut: string): Promise<void> {
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
  }

  async checkAvailability(checkIn: string, checkOut: string): Promise<void> {
    await this.setStayDates(checkIn, checkOut);
    await this.checkAvailabilityButton.click();
  }

  // fallow-ignore-next-line unused-class-member
  async roomBookingHrefs(): Promise<(string | null)[]> {
    return this.roomBookNowLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  }

  roomSearchExpectedHrefs(): typeof ROOM_SEARCH_EXPECTED_ROOM_HREFS {
    return ROOM_SEARCH_EXPECTED_ROOM_HREFS;
  }

  async fillContactForm(contact: ContactMessageDraft): Promise<void> {
    await this.contactNameInput.fill(contact.name);
    await this.contactEmailInput.fill(contact.email);
    await this.contactPhoneInput.fill(contact.phone);
    await this.contactSubjectInput.fill(contact.subject);
    await this.contactMessageInput.fill(contact.message);
  }

  // fallow-ignore-next-line unused-class-member
  async fillContactMessage(contact: ContactMessageDraft): Promise<void> {
    await this.fillContactForm(contact);
  }

  async contactFieldValues(): Promise<ContactMessageDraft> {
    return {
      name: await this.contactNameInput.inputValue(),
      email: await this.contactEmailInput.inputValue(),
      phone: await this.contactPhoneInput.inputValue(),
      subject: await this.contactSubjectInput.inputValue(),
      message: await this.contactMessageInput.inputValue(),
    };
  }

  // fallow-ignore-next-line unused-class-member
  async cookiePolicyHref(): Promise<string | null> {
    return this.cookiePolicyLink.getAttribute('href');
  }

  // fallow-ignore-next-line unused-class-member
  async privacyPolicyHref(): Promise<string | null> {
    return this.privacyPolicyLink.getAttribute('href');
  }

  // fallow-ignore-next-line unused-class-member
  policyLinkExpectedHrefs(): typeof POLICY_LINK_HREFS {
    return POLICY_LINK_HREFS;
  }
}
