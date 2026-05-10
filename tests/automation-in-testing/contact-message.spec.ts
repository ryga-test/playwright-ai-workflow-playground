// @provenance runId=2026-05-10T132304Z approvedAt=2026-05-10T13:29:00Z gate=write-spec
// Source-feature: tests/automation-in-testing/contact-message.feature
// Page-object: src/pages/automation-in-testing/automation-in-testing.page.ts
// Scenario-coverage: results/automation-in-testing/2026-05-10T132304Z/flows/contact-message/scenario-coverage.md
import { test, expect } from '@fixtures/base.fixture.js';
import { syntheticEmail } from '@helpers/test-data.js';
import { AutomationInTestingPage, type ContactMessageDraft } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@automation-in-testing @contact-message @smoke @public-demo @read-only @generated';

const testMessage: ContactMessageDraft = {
  name: 'Smoke Test Visitor',
  email: syntheticEmail('contact-message', 'example.test'),
  phone: '+44 7700 900123',
  subject: 'Read-only smoke test',
  message: 'This is an automated read-only smoke test. The form should not be submitted.',
};

test.describe('Flow: contact-message', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/#contact');
  });

  // TC-CM-001: Contact form fields accept and retain visitor input
  test(`TC-CM-001 Contact form fields accept and retain visitor input ${tags}`, async () => {
    await app.fillContactForm(testMessage);

    const values = await app.contactFieldValues();
    expect(values.name).toBe(testMessage.name);
    expect(values.email).toBe(testMessage.email);
    expect(values.phone).toBe(testMessage.phone);
    expect(values.subject).toBe(testMessage.subject);
    expect(values.message).toBe(testMessage.message);
  });

  // TC-CM-002: Submit button is visible and enabled after filling the form
  test(`TC-CM-002 Submit button is visible and enabled after filling the form ${tags}`, async () => {
    await app.fillContactForm(testMessage);

    await expect(app.submitContactButton).toBeVisible();
    await expect(app.submitContactButton).toBeEnabled();
  });

  // TC-CM-003: Scenario Outline — Individual contact fields persist correctly
  test(`TC-CM-003 name field contains expected value ${tags}`, async () => {
    await app.fillContactForm(testMessage);
    await expect(app.contactNameInput).toHaveValue(testMessage.name);
  });

  test(`TC-CM-003 email field contains expected value ${tags}`, async () => {
    await app.fillContactForm(testMessage);
    await expect(app.contactEmailInput).toHaveValue(testMessage.email);
  });

  test(`TC-CM-003 phone field contains expected value ${tags}`, async () => {
    await app.fillContactForm(testMessage);
    await expect(app.contactPhoneInput).toHaveValue(testMessage.phone);
  });

  test(`TC-CM-003 subject field contains expected value ${tags}`, async () => {
    await app.fillContactForm(testMessage);
    await expect(app.contactSubjectInput).toHaveValue(testMessage.subject);
  });

  test(`TC-CM-003 message field contains expected value ${tags}`, async () => {
    await app.fillContactForm(testMessage);
    await expect(app.contactMessageInput).toHaveValue(testMessage.message);
  });

  // TC-CM-004: Contact form loads empty before interaction
  test(`TC-CM-004 Contact form loads empty before interaction ${tags}`, async () => {
    const values = await app.contactFieldValues();
    expect(values.name).toBe('');
    expect(values.email).toBe('');
    expect(values.phone).toBe('');
    expect(values.subject).toBe('');
    expect(values.message).toBe('');
  });

  // TC-CM-005: Contact section headings are visible
  test(`TC-CM-005 Contact section headings are visible ${tags}`, async () => {
    await expect(app.contactInformationHeading).toBeVisible();
    await expect(app.contactFormHeading).toBeVisible();
  });

  // TC-CM-006: No contact message is submitted during preparation
  test(`TC-CM-006 No contact message is submitted during preparation ${tags}`, async () => {
    await app.fillContactForm(testMessage);

    // Should still be on the public home page (not redirected to a confirmation page)
    await expect(app.page).toHaveURL(/automationintesting\.online/);
    // The URL should not contain admin or confirmation paths
    await expect(app.page).not.toHaveURL(/\/admin/);
    await expect(app.page).not.toHaveURL(/\/confirmation/);

    // No submission confirmation alert should appear
    await expect(app.alertRegion).not.toHaveText(/.+/);
  });
});
