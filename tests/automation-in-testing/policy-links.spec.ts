// @provenance runId=2026-05-31T104819Z gate=write-spec sourceFeature=tests/automation-in-testing/policy-links.feature sourceFlow=apps/automation-in-testing/flows/policy-links.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import {
  AutomationInTestingPage,
  POLICY_LINK_HREFS,
} from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@smoke @public-demo @read-only @generated @policy-links';

// fallow-ignore-next-line code-duplication
test.describe('Flow: policy-links', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/');
  });

  test(`Visitor can see policy links and their destinations without leaving the home page ${tags}`, async ({ page }) => {
    // Traceability: tests/automation-in-testing/policy-links.feature
    // Scenario: Visitor can see policy links and their destinations without leaving the home page
    // Source-flow: apps/automation-in-testing/flows/policy-links.yaml
    const homeUrl = page.url();
    const expectedHrefs = POLICY_LINK_HREFS;

    await expect(app.cookiePolicyLink).toBeVisible();
    await expect(app.cookiePolicyLink).toHaveAttribute('href', expectedHrefs.cookie);
    await expect(app.privacyPolicyLink).toBeVisible();
    await expect(app.privacyPolicyLink).toHaveAttribute('href', expectedHrefs.privacy);
    await expect(page).toHaveURL(homeUrl);
  });
});
