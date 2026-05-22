// @provenance runId=2026-05-21T235545Z approvedAt=2026-05-22T00:00:00Z gate=test-draft-review sourceFeature=tests/automation-in-testing/room-search.feature sourceFlow=apps/automation-in-testing/flows/room-search.yaml
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @room-search';

// Resolved test data from step1 (relative dates strategy)
const checkIn = '29/05/2026';
const checkOut = '30/05/2026';

test.describe('Flow: room-search', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/#booking');
  });

  test(`Visitor searches for available rooms with future dates ${tags}`, async () => {
    // Traceability: results/.../step5-draft-tests/test-scenarios.feature
    // Scenario: Search for available rooms with future dates
    // Source-flow: apps/automation-in-testing/flows/room-search.yaml
    await expect(app.availabilityHeading).toBeVisible();

    await app.setStayDates(checkIn, checkOut);
    await app.checkAvailability(checkIn, checkOut);

    await expect(app.checkInInput).toHaveValue(checkIn);
    await expect(app.checkOutInput).toHaveValue(checkOut);
    await expect(app.roomsHeading).toBeVisible();
    await expect(app.singleRoomHeading).toBeVisible();
    await expect(app.doubleRoomHeading).toBeVisible();
    await expect(app.suiteRoomHeading).toBeVisible();
  });

  test(`Availability check prevents reservation flow ${tags}`, async () => {
    // Traceability: Scenario Outline example
    await app.setStayDates(checkIn, checkOut);
    await app.checkAvailability(checkIn, checkOut);

    await expect(app.roomsHeading).toBeVisible();
    // Guardrail: no checkout
    await expect(app.page).not.toHaveURL(/reservation|checkout|payment/i);
  });

  test(`View room details without committing ${tags}`, async () => {
    // Traceability: Scenario: View room details without committing
    await app.setStayDates(checkIn, checkOut);
    await app.checkAvailability(checkIn, checkOut);

    await expect(app.singleRoomHeading).toBeVisible();
    // Book Now visible but not clicked (out of scope per guardrail)
    await expect(app.singleRoomBookNowLink).toBeVisible();
  });
});
