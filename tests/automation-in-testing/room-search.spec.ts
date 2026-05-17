// @provenance runId=2026-05-17T155137Z approvedAt=2026-05-17T15:58:05Z gate=test-draft-review sourceFeature=tests/automation-in-testing/room-search.feature sourceFlow=apps/automation-in-testing/flows/room-search.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @room-search';
const checkIn = '24/05/2026';
const checkOut = '25/05/2026';

test.describe('Flow: room-search', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/#booking');
  });

  test(`Visitor checks room availability without entering checkout ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/room-search.feature
    // Scenario: Visitor checks room availability without entering checkout
    // Source-flow: apps/automation-in-testing/flows/room-search.yaml
    await expect(app.availabilityHeading).toBeVisible();

    await app.checkAvailability(checkIn, checkOut);

    await expect(app.checkInInput).toHaveValue(checkIn);
    await expect(app.checkOutInput).toHaveValue(checkOut);
    await expect(app.roomsHeading).toBeVisible();
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.suiteRoomHeading).toBeVisible();

    await expect(app.roomBookNowLinks).toHaveCount(3);
    await expect(app.singleRoomBookNowLink).toBeVisible();
    await expect(app.doubleRoomBookNowLink).toBeVisible();
    await expect(app.suiteRoomBookNowLink).toBeVisible();

    const expectedHrefs = app.roomSearchExpectedHrefs();
    await expect(app.singleRoomBookNowLink).toHaveAttribute('href', expectedHrefs.single);
    await expect(app.doubleRoomBookNowLink).toHaveAttribute('href', expectedHrefs.double);
    await expect(app.suiteRoomBookNowLink).toHaveAttribute('href', expectedHrefs.suite);
    await expect(app.page).not.toHaveURL(/\/reservation\//);
  });
});
