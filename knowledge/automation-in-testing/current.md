# Automation in Testing — Current Knowledge

## Scope

- App slug: `automation-in-testing`
- Public URL: `https://automationintesting.online/`
- Env var: `AUTOMATION_IN_TESTING_BASE_URL`

## Current Testing Policy

- Public smoke coverage should remain safe for a live demo site.
- Safe interactions include page load, section navigation, availability search, room option visibility, contact field filling without submission, and public policy link inspection.
- Avoid real credentials, payment data, email/SMS dependent assertions, admin login attempts, final booking submission, contact message submission, and policy-page navigation unless explicitly approved for a flow.

## Current Verified Runtime Observations

- The public home page exposes the heading "Welcome to Shady Meadows B&B".
- Primary navigation exposes Rooms, Booking, Amenities, Location, Contact, and Admin links.
- The hero "Book Now" link reaches the availability search area.
- Availability search can be initiated with editable stay dates while keeping room booking options visible and without completing a reservation.
- Three `Book now` room links are visible as booking options after search; room-search treats them as assertion-only and does not click them.
- Contact fields accept and retain obvious test data before submission.
- The contact form Submit button is visible and enabled after filling all fields; not clicked.
- The alert ARIA region remains empty after contact form fill (no submission feedback triggered).
- All five contact form fields load empty on initial navigation to `/#contact`.
- Footer Cookie-Policy and Privacy-Policy links are visible on `/`, expose raw hrefs `/cookie` and `/privacy`, and can be verified without navigating away.
- The public home page loads at `/` and renders the welcome heading plus public nav links for Rooms, Booking, Amenities, Location, and Contact.
- The brand logo link "Shady Meadows B&B" is visible and navigates to `/`.

### Public Home (verified 2026-06-07T010736Z)

- The h1 welcome heading "Welcome to Shady Meadows B&B" is visible on `/`.
- Five public navigation links are visible in the navigation landmark: Rooms, Booking, Amenities, Location, Contact.
- The brand logo link "Shady Meadows B&B" is visible and navigates to `/`.
- All P1 `getByRole` selectors confirmed stable with zero drift across 8 consecutive runs.
- Default availability dates observed: Check In `07/06/2026`, Check Out `08/06/2026`.

### Section Navigation (verified 2026-06-06T025645Z)

- Clicking header `Rooms` link scrolls to the "Our Rooms" heading (h2).
- Clicking header `Booking` link scrolls to the "Check Availability & Book Your Stay" heading (h3).
- Clicking header `Location` link scrolls to the "Our Location" heading (h2).
- Clicking header `Contact` link scrolls to the "Contact Information" heading (h3).
- All header nav links and section headings use P1 `getByRole` selectors — confirmed stable.

### Policy Links (verified 2026-06-07T005234Z)

- Footer `Cookie-Policy` link is visible on the public home page at `/`.
- `Cookie-Policy` link exposes the app-relative destination `/cookie`.
- Footer `Privacy-Policy` link is visible on the public home page at `/`.
- `Privacy-Policy` link exposes the app-relative destination `/privacy`.
- Footer-scoped role locators (`contentinfo.getByRole`) for policy links remain stable.
- All P1 `getByRole` selectors confirmed stable with zero drift across 8 consecutive runs.

### Location Section (verified 2026-05-14T130209Z)

- The `#location` section heading "Our Location" (h2) and "Contact Information" (h3) are visible.
- Map attribution links "Pigeon" and "OpenStreetMap" are visible within `#location`.
- Address, phone, and email contact details are visible within `#location`:
  - Address: "Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA"
  - Phone: "012345678901"
  - Email: "fake@fakeemail.com"
- Contact detail labels use `h5` headings (Address, Phone, Email) within `#location`.

## Current Selector Rules

- Prefer role locators for named navigation links, headings, buttons, landmarks, and public links.
- Use exact matching to distinguish hero `Book Now` from repeated room `Book now` links.
- Use footer-scoped role locators for policy links: `page.getByRole('contentinfo').getByRole('link', { name: 'Cookie-Policy' })` and `Privacy-Policy`.
- Use `getByTestId()` locators (`ContactName`, `ContactEmail`, `ContactPhone`, `ContactSubject`, `ContactDescription`) for all contact form fields — confirmed stable across multiple runs.
- Availability date inputs are currently unnamed textboxes; use positional locators only within a booking/room-search page object until stable labels/test ids are available.
- Scope duplicate contact/address text to `#location` via page object fields (R05, R15).
- Define `#location`-scoped locators on the shared page object to keep specs clean and avoid `.first()` workarounds (R15).
- For `public-home`, use the home route `/` explicitly and keep assertions read-only with `getByRole` visibility checks.
- Expose `welcomeHeading` and `brandLink` aliases on the shared page object for the `public-home` spec.
- Navigation-scoped `getByRole('link')` for header nav links and `getByRole('heading')` for section headings are the canonical strategy for `section-navigation` (R29).
- Public-home P1 `getByRole` selectors confirmed stable across 8 consecutive runs (R32).
- Policy-link footer-scoped role locators confirmed stable across 8 consecutive runs (R31).

## Latest Successful Run

- Run: `2026-06-07T010736Z`
- Flow: `public-home`
- Result: 3/3 passed with 0 fix cycles
- Artifacts: `results/automation-in-testing/flows/public-home/2026-06-07T010736Z/`

## Recent Runs

### Run 2026-06-07T010736Z

- Flow: `public-home`
- Result: 3/3 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Default dates: 07/06/2026 to 08/06/2026. No side effects. 8th consecutive successful run for public-home.
- Artifacts: `results/automation-in-testing/flows/public-home/2026-06-07T010736Z/`

### Run 2026-06-07T005234Z

- Flow: `policy-links`
- Result: 2/2 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Policy links verified without navigation. No side effects. 8th consecutive successful run for policy-links.
- Artifacts: `results/automation-in-testing/flows/policy-links/2026-06-07T005234Z/`

### Run 2026-06-06T035102Z

- Flow: `public-home`
- Result: 3/3 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Default dates: 06/06/2026 to 07/06/2026. No side effects.
- Artifacts: `results/automation-in-testing/flows/public-home/2026-06-06T035102Z/`

### Run 2026-06-06T025645Z

- Flow: `section-navigation`
- Result: 4/4 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Header nav click-to-section navigation verified. No side effects.
- Artifacts: `results/automation-in-testing/flows/section-navigation/2026-06-06T025645Z/`

### Run 2026-06-03T092756Z

- Flow: `public-home`
- Result: 3/3 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Default dates: 03/06/2026 to 04/06/2026. No side effects.
- Artifacts: `results/automation-in-testing/flows/public-home/2026-06-03T092756Z/`

### Run 2026-06-03T075437Z

- Flow: `policy-links`
- Result: 1/1 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Policy links verified without navigation. No side effects. 7th consecutive successful run.
- Artifacts: `results/automation-in-testing/flows/policy-links/2026-06-03T075437Z/`

### Run 2026-06-03T070659Z

- Flow: `policy-links`
- Result: 1/1 tests passed with 0 fix cycles
- Notes: All P1 getByRole selectors confirmed stable with zero drift. Policy links verified without navigation. No side effects.
- Artifacts: `results/automation-in-testing/flows/policy-links/2026-06-03T070659Z/`
