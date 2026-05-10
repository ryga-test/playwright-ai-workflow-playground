// @provenance source=apps/automation-in-testing/flows/public-home.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @public-home';

// fallow-ignore-next-line code-duplication
test.describe('Flow: public-home', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor sees the public home page introduction ${tags}`, async () => {
    await expect(app.pageHeading).toBeVisible();
    await expect(app.brandHomeLink).toBeVisible();
    await expect(app.navigation).toBeVisible();
    await expect(app.navRoomsLink).toBeVisible();
    await expect(app.navBookingLink).toBeVisible();
    await expect(app.navAmenitiesLink).toBeVisible();
    await expect(app.navLocationLink).toBeVisible();
    await expect(app.navContactLink).toBeVisible();
    await expect(app.navAdminLink).toBeVisible();
  });
});
