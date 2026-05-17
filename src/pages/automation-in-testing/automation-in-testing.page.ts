// @provenance runId=2026-05-17T092115Z approvedAt=2026-05-17T09:27:00.000Z gate=page-object-review
import type { Locator, Page } from '@playwright/test';

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
 * Generated from approved page-object drafts, including:
 * - results/automation-in-testing/2026-05-10T132304Z/step3-extract-selectors/normalized-selectors.md
 * - results/automation-in-testing/flows/policy-links/2026-05-17T092115Z/step3-extract-selectors/normalized-selectors.md
 *
 * Selected flow coverage includes:
 * - contact-message: prepare a public contact message without submitting it.
 * - policy-links: verify public footer policy links and href values without navigating away.
 *
 * Safety notes:
 * - Read-only flows must not click room reservation links, submit contact forms, log in, or load policy pages unless explicitly in scope.
 * - This page object exposes potentially state-changing controls for assertions only where generated flows forbid the action.
 */
export class AutomationInTestingPage {
  readonly navigation: Locator;
  readonly pageHeading: Locator;
  readonly mainHeading: Locator;
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

  // Scoped to #location per R05 to avoid duplicate-text false positives from footer
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
    this.brandHomeLink = page.getByRole('link', { name: 'Shady Meadows B&B' });
    this.brandLink = this.brandHomeLink;
    this.navRoomsLink = this.navigation.getByRole('link', { name: 'Rooms' });
    this.navBookingLink = this.navigation.getByRole('link', { name: 'Booking' });
    this.navAmenitiesLink = this.navigation.getByRole('link', { name: 'Amenities' });
    this.navLocationLink = this.navigation.getByRole('link', { name: 'Location' });
    this.navContactLink = this.navigation.getByRole('link', { name: 'Contact' });
    this.contactNavLink = this.navContactLink;
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
    this.pigeonMapAttributionLink = page.locator('#location').getByRole('link', { name: 'Pigeon' });
    this.openStreetMapAttributionLink = page.locator('#location').getByRole('link', { name: 'OpenStreetMap' });

    // Scoped to #location per R05 to avoid duplicate-text false positives from footer contact content
    this.locationSection = page.locator('#location');
    this.locationAddressLabel = this.locationSection.getByRole('heading', { name: 'Address', level: 5 });
    this.locationAddressText = this.locationSection.getByText('Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA');
    this.locationPhoneLabel = this.locationSection.getByRole('heading', { name: 'Phone', level: 5 });
    this.locationPhoneText = this.locationSection.getByText('012345678901');
    this.locationEmailLabel = this.locationSection.getByRole('heading', { name: 'Email', level: 5 });
    this.locationEmailText = this.locationSection.getByText('fake@fakeemail.com');

    // Provenance: flow=contact-message path=/#contact
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

    // Provenance: flow=policy-links path=/ selector-priority=P1 getByRole
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

  async goto(path = '/#contact'): Promise<void> {
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

  // fallow-ignore-next-line unused-class-member
  async openAdmin(): Promise<void> {
    await this.navAdminLink.click();
  }

  async setStayDates(checkIn: string, checkOut: string): Promise<void> {
    await this.checkInInput.fill(checkIn);
    await this.checkOutInput.fill(checkOut);
  }

  async checkAvailability(checkIn: string, checkOut: string): Promise<void> {
    await this.setStayDates(checkIn, checkOut);
    await this.checkAvailabilityButton.click();
  }

  async fillContactForm(contact: ContactMessageDraft): Promise<void> {
    await this.contactNameInput.fill(contact.name);
    await this.contactEmailInput.fill(contact.email);
    await this.contactPhoneInput.fill(contact.phone);
    await this.contactSubjectInput.fill(contact.subject);
    await this.contactMessageInput.fill(contact.message);
  }

  /** Alias for readability in scenarios that call the action a contact message. */
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

}
