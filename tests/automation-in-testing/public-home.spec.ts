// @provenance runId=2026-05-17T142233Z approvedAt=2026-05-17T14:31:18+00:00 gate=test-draft-review source=tests/automation-in-testing/public-home.feature flow=apps/automation-in-testing/flows/public-home.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @public-home';

// fallow-ignore-next-line code-duplication
test.describe('Flow: public-home', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/');
  });

  test(`Visitor sees the welcome heading ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/public-home.feature
    // Scenario: Visitor sees the welcome heading
    // Source-flow: apps/automation-in-testing/flows/public-home.yaml
    await expect(app.welcomeHeading).toBeVisible();
  });

  test(`Visitor sees public navigation options ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/public-home.feature
    // Scenario: Visitor sees public navigation options
    // Source-flow: apps/automation-in-testing/flows/public-home.yaml
    await expect(app.navRoomsLink).toBeVisible();
    await expect(app.navBookingLink).toBeVisible();
    await expect(app.navAmenitiesLink).toBeVisible();
    await expect(app.navLocationLink).toBeVisible();
    await expect(app.navContactLink).toBeVisible();
  });

  test(`Visitor sees the brand logo link ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/public-home.feature
    // Scenario: Visitor sees the brand logo link
    // Source-flow: apps/automation-in-testing/flows/public-home.yaml
    await expect(app.brandLink).toBeVisible();
  });
});
