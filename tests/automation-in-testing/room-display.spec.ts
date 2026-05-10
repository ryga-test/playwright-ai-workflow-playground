// @provenance source=apps/automation-in-testing/flows/room-display.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @room-display';

// fallow-ignore-next-line code-duplication
test.describe('Flow: room-display', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor sees each public room type — Single ${tags}`, async () => {
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.singleRoomBookNowLink).toBeVisible();
  });

  test(`Visitor sees each public room type — Double ${tags}`, async () => {
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
  });

  test(`Visitor sees each public room type — Suite ${tags}`, async () => {
    await expect(app.suiteRoomHeading).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();
  });
});
