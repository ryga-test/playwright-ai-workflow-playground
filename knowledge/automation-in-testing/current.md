# Automation in Testing — Current Knowledge

## Scope

- App slug: `automation-in-testing`
- Public URL: `https://automationintesting.online/`
- Env var: `AUTOMATION_IN_TESTING_BASE_URL`

## Current Testing Policy

- Public smoke coverage should remain safe for a live demo site.
- Safe interactions include page load, section navigation, availability search, room option visibility, contact field filling without submission, and public policy link inspection.
- Avoid real credentials, payment data, email/SMS dependent assertions, admin login attempts, final booking submission, and contact message submission unless explicitly approved for a state-changing run.

## Current Verified Runtime Observations

- The public home page exposes the heading "Welcome to Shady Meadows B&B".
- Primary navigation exposes Rooms, Booking, Amenities, Location, Contact, and Admin links.
- The hero "Book Now" link reaches the availability search area.
- Availability search can be initiated with editable stay dates while keeping room booking options visible and without completing a reservation.
- The latest verified room-search run used `17/05/2026` to `18/05/2026`, stayed outside `/reservation/`, and showed Single, Double, and Suite options.
- Three `Book now` room links are visible as booking options after search; room-search treats them as assertion-only and does not click them.
- Contact fields accept and retain obvious test data before submission.
- The contact form Submit button is visible and enabled after filling all fields; not clicked.
- The alert ARIA region remains empty after contact form fill (no submission feedback triggered).
- All five contact form fields load empty on initial navigation to `/#contact`.
- Cookie-Policy and Privacy-Policy links are visible and route to `/cookie` and `/privacy`.

## Current Selector Rules

- Prefer role locators for named navigation links, headings, buttons, and public links.
- Use exact matching to distinguish hero `Book Now` from repeated room `Book now` links.
- Use `getByTestId()` locators (`ContactName`, `ContactEmail`, `ContactPhone`, `ContactSubject`, `ContactDescription`) for all contact form fields — confirmed stable across 4 runs.
- Availability date inputs are currently unnamed textboxes; use positional locators only within a booking/room-search page object until stable labels/test ids are available.
- Scope duplicate contact/address text to a stable section or footer region.

## Latest Successful Run

- Run: `2026-05-10T132304Z`
- Flow: `contact-message`
- Result: 10/10 passed with 0 fix cycles
- Artifacts: `results/automation-in-testing/2026-05-10T132304Z/`
