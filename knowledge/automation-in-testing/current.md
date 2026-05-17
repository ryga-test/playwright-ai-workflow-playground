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
- The latest verified room-search run used `17/05/2026` to `18/05/2026`, stayed outside `/reservation/`, and showed Single, Double, and Suite options.
- Three `Book now` room links are visible as booking options after search; room-search treats them as assertion-only and does not click them.
- Contact fields accept and retain obvious test data before submission.
- The contact form Submit button is visible and enabled after filling all fields; not clicked.
- The alert ARIA region remains empty after contact form fill (no submission feedback triggered).
- All five contact form fields load empty on initial navigation to `/#contact`.
- Footer Cookie-Policy and Privacy-Policy links are visible on `/`, expose raw hrefs `/cookie` and `/privacy`, and can be verified without navigating away.
- The public home page loads at `/` and renders the welcome heading plus public nav links for Rooms, Booking, Amenities, Location, and Contact.
- The brand logo link "Shady Meadows B&B" is visible and navigates to `/`.

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

## Latest Successful Run

- Run: `2026-05-17T142233Z`
- Flow: `public-home`
- Result: 3/3 passed with 0 fix cycles
- Artifacts: `results/automation-in-testing/flows/public-home/2026-05-17T142233Z/`
