// @provenance source=apps/automation-in-testing/flows/room-search.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { formatRelativeDate } from '@helpers/test-data.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @room-search';

test.describe('Flow: room-search', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto();
  });

  test(`Visitor checks room availability for selected dates ${tags}`, async () => {
    const checkIn = formatRelativeDate(7, 'DD/MM/YYYY'); // from testData.checkIn
    const checkOut = formatRelativeDate(8, 'DD/MM/YYYY'); // from testData.checkOut

    await app.checkAvailability(checkIn, checkOut);

    await expect(app.singleRoomBookNowLink).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();
    await expect(app.page).not.toHaveURL(/\/reservation\//);
  });
});
