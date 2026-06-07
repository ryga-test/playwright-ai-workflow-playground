// @provenance runId=2026-06-06T025645Z approvedAt=2026-06-06T03:06:07Z gate=test-draft-review source=tests/automation-in-testing/section-navigation.feature sourceFlow=apps/automation-in-testing/flows/section-navigation.yaml
// @provenance runId=2026-05-17T100540Z approvedAt=2026-05-17T10:05:40Z gate=test-draft-review sourceFlow=apps/automation-in-testing/flows/section-navigation.yaml sourceFeature=tests/automation-in-testing/section-navigation.feature
import { test, expect } from '@fixtures/base.fixture.js';
import { AutomationInTestingPage } from '@pages/automation-in-testing/automation-in-testing.page.js';

const tags = '@generated @smoke @public-demo @read-only @section-navigation';

test.describe('Flow: section-navigation', () => {
  let app: AutomationInTestingPage;

  test.beforeEach(async ({ page }) => {
    app = new AutomationInTestingPage(page);
    await app.goto('/');
  });

  test(`Visitor navigates to the Rooms section ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/section-navigation.feature
    // Scenario: Visitor navigates to the Rooms section
    // Source-flow: apps/automation-in-testing/flows/section-navigation.yaml
    await app.openRoomsSection();
    await expect(app.roomsHeading).toBeVisible();
  });

  test(`Visitor navigates to the Booking section ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/section-navigation.feature
    // Scenario: Visitor navigates to the Booking section
    // Source-flow: apps/automation-in-testing/flows/section-navigation.yaml
    await app.openBookingSection();
    await expect(app.availabilityHeading).toBeVisible();
  });

  test(`Visitor navigates to the Location section ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/section-navigation.feature
    // Scenario: Visitor navigates to the Location section
    // Source-flow: apps/automation-in-testing/flows/section-navigation.yaml
    await app.openLocationSection();
    await expect(app.locationHeading).toBeVisible();
  });

  test(`Visitor navigates to the Contact section ${tags}`, async () => {
    // Traceability: tests/automation-in-testing/section-navigation.feature
    // Scenario: Visitor navigates to the Contact section
    // Source-flow: apps/automation-in-testing/flows/section-navigation.yaml
    await app.openContactSection();
    await expect(app.contactInformationHeading).toBeVisible();
  });
});
