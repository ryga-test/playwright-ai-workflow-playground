# Automation in Testing — Verified Knowledge

> **⚠️ Append-only file.** Add new observations under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate observations already present in the file.

---

## Human-Curated

### App Identity

- Public practice site: `https://automationintesting.online/`
- App slug: `automation-in-testing`
- Base URL env var: `AUTOMATION_IN_TESTING_BASE_URL`

### Testing Policy

- First pipeline run should be read-only public smoke coverage.
- First run may inspect page structure, navigation, listings, forms, and non-submitting validation.
- First run should not submit bookings or contact messages.
- Second and later runs may add safe demo submissions using obvious test data, if the flow does not require real credentials, payment, or email/SMS delivery.

---

## Runs

*(Populated by pipeline runs.)*

## Run 2026-05-09T135109Z

### Verified UI Facts

- The public home page exposes the level-1 heading "Welcome to Shady Meadows B&B".
- The page has a navigation landmark with links named "Rooms", "Booking", "Amenities", "Location", "Contact", and "Admin".
- Header navigation links expose these hrefs: `/`, `/#rooms`, `/#booking`, `/#amenities`, `/#location`, `/#contact`, and `/admin`.
- The hero "Book Now" link scrolls or targets the booking/availability area without submitting a booking.
- The availability section heading is "Check Availability & Book Your Stay".
- The default availability dates observed in this run were Check In `09/05/2026` and Check Out `10/05/2026`.
- Availability date textboxes can be edited and retain entered values without continuing to a reservation.
- The rooms section exposes room headings "Single", "Double", and "Suite".
- Observed room prices were "£100 per night", "£150 per night", and "£225 per night".
- Room reservation links target `/reservation/1`, `/reservation/2`, and `/reservation/3` with `checkin=2026-05-09` and `checkout=2026-05-10` query parameters.
- The location section exposes map attribution links "Pigeon" and "OpenStreetMap".
- Contact information includes address text for Shady Meadows B&B in Newingtonfordburyshire, phone number `012345678901`, and email `fake@fakeemail.com`.
- The contact form exposes named textboxes for Name, Email, Phone, and Subject, plus an unnamed message textarea with id `description`.
- Contact form fields start empty and retain values when filled without clicking Submit.
- The footer exposes quick links Home, Rooms, Booking, and Contact, plus Cookie-Policy, Privacy-Policy, Admin panel, and Mark Winteringham links.
- The discovered public home page has no table role; table-content verification is not applicable for this page.

### Verified Test Coverage

- 17 read-only smoke scenarios passed against the public site.
- No booking, contact-message submission, credential entry, or authenticated action was performed.

## Run 2026-05-09T235844Z

### Verified UI Facts

- The default availability dates observed in this run were Check In `10/05/2026` and Check Out `11/05/2026`.
- Availability search can be initiated with editable stay dates and still leaves room booking options visible without completing a reservation.
- Room reservation links in this run targeted `/reservation/1`, `/reservation/2`, and `/reservation/3` with `checkin=2026-05-10` and `checkout=2026-05-11` query parameters.
- The hero CTA text `Book Now` and repeated room link text `Book now` are distinct to users but require exact role-name matching in Playwright to avoid ambiguity.
- Contact form fields accepted and retained obvious test data before submission.
- The contact form Submit button was visible and enabled, and an alert region was attached for validation/submission feedback.

### Verified Test Coverage

- 18 public smoke scenarios passed against the public site.
- One availability search was initiated, but no booking was completed.
- No room reservation link was clicked, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-10T004617Z

### Verified UI Facts

- The public home page still exposes the level-1 heading "Welcome to Shady Meadows B&B".
- The page navigation still exposes public section links for Rooms, Booking, Amenities, Location, Contact, and Admin.
- The hero "Book Now" call to action still reaches the availability search area.
- Availability search for `10/05/2026` to `11/05/2026` completed without entering a reservation flow and left room booking options visible.
- The rooms section still exposes room headings "Single", "Double", and "Suite" with visible booking options.
- Contact form fields accepted and retained obvious read-only test data before submission.
- The contact form Submit button remained visible and enabled, but was not clicked in this run.
- Public location/contact information remained visible, including Shady Meadows B&B address text, phone number `012345678901`, and email `fake@fakeemail.com`.
- Public policy links for Cookie-Policy and Privacy-Policy remained visible with `/cookie` and `/privacy` destinations.

### Verified Test Coverage

- 13 Gherkin-sourced public smoke tests passed against the public site.
- Every generated Playwright test traced to one approved Gherkin scenario or scenario-outline example row.
- No room reservation link was clicked, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-10T122428Z

### Verified UI Facts

- Availability search for `17/05/2026` to `18/05/2026` completed without entering the reservation checkout flow.
- The room-search flow left the visitor outside `/reservation/` after checking availability.
- The rooms section exposed visible options for Single, Double, and Suite after availability search.
- Three visible `Book now` room booking links were present as options, but they were not clicked.

### Verified Test Coverage

- One Gherkin-sourced `room-search` Playwright test passed against the public site.
- No room reservation link was clicked, no booking was completed, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-10T132304Z

### Verified UI Facts

- Contact form fields (Name, Email, Phone, Subject, Message) accept and retain obvious test data without submission.
- The contact form Submit button is visible and enabled after filling all five fields.
- The page stays on the public home page (`automationintesting.online`) after filling the contact form — no redirect, confirmation page, or submission feedback.
- The `alert` ARIA region remains empty after contact form fill (no validation or submission message triggered).
- All five contact form fields load empty on initial navigation to `/#contact`.
- The "Contact Information" (level 3) and "Send Us a Message" (level 3) headings are visible on the contact section.
- `getByTestId()` selectors (`ContactName`, `ContactEmail`, `ContactPhone`, `ContactSubject`, `ContactDescription`) confirmed working for all contact form fields in a 10-test run.

### Verified Test Coverage

- 10 Gherkin-sourced `contact-message` Playwright tests passed against the public site.
- Every test traced to one approved Gherkin scenario or scenario-outline example row (6 scenarios, 10 test cases).
- No Submit button was clicked, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-14T130209Z

### Verified UI Facts

- The `#location` section heading "Our Location" (level 2) is visible after navigating to `/#location`.
- Map attribution links "Pigeon" and "OpenStreetMap" are visible and scoped to `#location`.
- The "Contact Information" heading (level 3) is visible within `#location`.
- Address text "Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA" is visible within `#location`.
- Phone text "012345678901" is visible within `#location`.
- Email text "fake@fakeemail.com" is visible within `#location`.
- `#location`-scoped `getByText()` locators avoid strict-mode duplicate-text failures from footer contact content.
- Address, Phone, and Email labels use `h5` headings within `#location` with accessible names.

### Verified Test Coverage

- 1 Gherkin-sourced `location-contact-info` Playwright test passed against the public site.
- The test traced to the approved "Location section displays map attribution and contact details" scenario.
- All assertions used `toBeVisible()` per R06; no form interaction or submission occurred.

## Run 2026-05-17T092115Z

### Verified UI Facts

- The footer `Cookie-Policy` link is visible on the public home page and exposes the app-relative destination `/cookie`.
- The footer `Privacy-Policy` link is visible on the public home page and exposes the app-relative destination `/privacy`.
- The `policy-links` flow verified policy link destinations without clicking either policy link and without leaving the home page.
- Footer-scoped role locators for `Cookie-Policy` and `Privacy-Policy` passed against the public site.

### Verified Test Coverage

- 1 Gherkin-sourced `policy-links` Playwright test passed against the public site.
- The test traced to the approved "Visitor can see policy links and their destinations without leaving the home page" scenario.
- No policy page was loaded, no booking was completed, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-17T094218Z

### Verified UI Facts

- Availability search for `24/05/2026` to `25/05/2026` completed without entering the reservation checkout flow.
- The room-search flow left the visitor outside `/reservation/` after checking availability.
- The rooms section exposed visible options for Single, Double, and Suite after availability search.
- Three visible room `Book now` links were present and exposed reservation hrefs for the selected dates: `/reservation/1?checkin=2026-05-24&checkout=2026-05-25`, `/reservation/2?checkin=2026-05-24&checkout=2026-05-25`, and `/reservation/3?checkin=2026-05-24&checkout=2026-05-25`.
- The booking date inputs accepted and retained the resolved test data values `24/05/2026` and `25/05/2026`.

### Verified Test Coverage

- 1 Gherkin-sourced `room-search` Playwright test passed against the public site.
- The test traced to the approved "Visitor checks room availability without entering checkout" scenario.
- No room reservation link was clicked, no booking was completed, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-17T120959Z

### Verified UI Facts

- The public home page at `/` loads and renders the h1 welcome heading "Welcome to Shady Meadows B&B".
- Five public navigation links are visible on the home page: Rooms, Booking, Amenities, Location, Contact.
- The Admin navigation link exists on the page but was not asserted because admin access is out of scope per the flow definition.
- The brand logo link "Shady Meadows B&B" is visible and navigates to `/`.
- Explicit `goto('/')` navigation is more appropriate for read-only home page smoke coverage than relying on the shared page object's default `/#booking`.

### Verified Test Coverage

- 3 Gherkin-sourced `public-home` Playwright tests passed against the public site.
- Tests traced to approved scenarios: "Visitor sees the welcome heading", "Visitor sees public navigation options", and "Visitor sees the brand logo link".
- All selectors were P1 `getByRole` with zero CSS/XPath fallbacks.
- No admin link was clicked, no booking was initiated, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-17T142233Z

### Verified UI Facts

- The public home page at `/` loads and renders the h1 welcome heading "Welcome to Shady Meadows B&B".
- The page exposes public navigation links for Rooms, Booking, Amenities, Location, and Contact.
- The brand logo link "Shady Meadows B&B" is visible and navigates to `/`.
- The public-home spec uses an explicit `goto('/')` baseline and read-only visibility assertions only.
- The shared page object now exposes `welcomeHeading` and `brandLink` aliases for the public-home flow, alongside role-based nav links.

### Verified Test Coverage

- 3 Gherkin-sourced `public-home` Playwright tests passed against the public site.
- No retries were needed.
- No admin link was clicked, no booking was initiated, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.

## Run 2026-05-17T155137Z

### Verified UI Facts

- Availability search for `24/05/2026` to `25/05/2026` completed without entering the reservation checkout flow.
- The room-search flow left the visitor outside `/reservation/` after checking availability.
- The rooms section exposed visible options for Single, Double, and Suite after availability search.
- Three visible `Book now` room booking links were present and exposed reservation hrefs for the selected dates: `/reservation/1?checkin=2026-05-24&checkout=2026-05-25`, `/reservation/2?checkin=2026-05-24&checkout=2026-05-25`, and `/reservation/3?checkin=2026-05-24&checkout=2026-05-25`.
- The booking date inputs accepted and retained the resolved test data values `24/05/2026` and `25/05/2026`.

### Verified Test Coverage

- 1 Gherkin-sourced `room-search` Playwright test passed against the public site.
- The test traced to the approved "Visitor checks room availability without entering checkout" scenario.
- No room reservation link was clicked, no booking was completed, no contact message was submitted, no credentials were entered, and no authenticated action was attempted.
