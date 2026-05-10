// @provenance source=apps/automation-in-testing/flows/policy-links.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @policy-links';

// fallow-ignore-next-line code-duplication
test.describe('Flow: policy-links', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor can access public policy links ${tags}`, async () => {
    await expect(app.cookiePolicyLink).toBeVisible();
    await expect(app.cookiePolicyLink).toHaveAttribute('href', '/cookie');
    await expect(app.privacyPolicyLink).toBeVisible();
    await expect(app.privacyPolicyLink).toHaveAttribute('href', '/privacy');
  });
});
