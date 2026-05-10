// @provenance source=apps/automation-in-testing/flows/contact-message.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { syntheticEmail } from '@helpers/test-data.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @contact-message';

test.describe('Flow: contact-message', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor can prepare a contact message without sending it ${tags}`, async () => {
    const message = {
      name: 'Read Only Visitor',
      email: syntheticEmail('contact-message', 'example.test'), // from testData.contactEmail
      phone: '01234567890',
      subject: 'Read-only smoke test', // from testData.subject
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
});
