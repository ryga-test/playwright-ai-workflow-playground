// @provenance runId=2026-06-07T005234Z approvedAt=2026-06-07T00:58:57Z gate=test-draft-review source=tests/automation-in-testing/policy-links.feature
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage, POLICY_LINK_HREFS } from '@pages/automation-in-testing/automation-in-testing.page.js';

test.describe('Policy links', () => {
  let page: AutomationInTestingPage;

  test.beforeEach(async ({ page: pwPage }) => {
    page = new AutomationInTestingPage(pwPage);
    await page.goto('/');
  });

  // Scenario: Visitor sees the cookie policy link with the expected href
  // Traceability: tests/automation-in-testing/policy-links.feature line 13
  test('Visitor sees the cookie policy link with the expected href', async () => {
    await expect(page.cookiePolicyLink).toBeVisible();
    const href = await page.cookiePolicyHref();
    expect(href).toBe(POLICY_LINK_HREFS.cookie);
  });

  // Scenario: Visitor sees the privacy policy link with the expected href
  // Traceability: tests/automation-in-testing/policy-links.feature line 17
  test('Visitor sees the privacy policy link with the expected href', async () => {
    await expect(page.privacyPolicyLink).toBeVisible();
    const href = await page.privacyPolicyHref();
    expect(href).toBe(POLICY_LINK_HREFS.privacy);
  });
});
