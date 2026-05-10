// @provenance runId=2026-05-10T122428Z approvedAt=2026-05-10T12:28:13Z gate=test-draft-review sourceFlow=apps/automation-in-testing/flows/room-search.yaml sourceFeature=tests/automation-in-testing/room-search.feature
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

  test(`Visitor checks room availability without entering checkout ${tags}`, async () => {
    // Scenario: Visitor checks room availability without entering checkout
    const checkIn = formatRelativeDate(7, 'DD/MM/YYYY'); // from testData.checkIn
    const checkOut = formatRelativeDate(8, 'DD/MM/YYYY'); // from testData.checkOut

    await expect(app.availabilityHeading).toBeVisible();

    await app.checkAvailability(checkIn, checkOut);

    await expect(app.roomsHeading).toBeVisible();
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.suiteRoomHeading).toBeVisible();
    await expect(app.singleRoomBookNowLink).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();
    await expect(app.page).not.toHaveURL(/\/reservation\//);
  });
});
