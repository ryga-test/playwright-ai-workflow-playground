# Selector Notes: automation-in-testing

> **⚠️ Append-only file.** Add new findings under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.

---

## Locator Priority

Per constitutional Principle II, locators follow this priority order:

1. **getByRole** — accessible, stable, framework-agnostic (preferred)
2. **getByTestId** — stable when `data-testid` attributes exist
3. **getByLabel** — good for form inputs with associated `<label>` elements
4. **getByPlaceholder** — usable, less stable than labels
5. **getByText** — fragile to content changes
6. **CSS / XPath** — last resort, brittle, document with justification

---

## Human-Curated

- Prefer accessible role/label locators where the public site exposes stable accessible names.
- Document any CSS/XPath fallback with the reason it was needed.

---

## Findings

*(Populated by pipeline runs.)*

## Run 2026-05-09T135109Z

- Preferred selectors that passed in tests:
  - `page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B', level: 1 })`
  - `page.getByRole('navigation')`
  - `navigation.getByRole('link', { name: 'Rooms' })`, `Booking`, `Amenities`, `Location`, `Contact`, `Admin`
  - `page.getByRole('link', { name: 'Book Now', exact: true })`
  - `page.getByRole('link', { name: 'Book now', exact: true }).nth(0..2)` for room links
  - `page.getByRole('textbox', { name: 'Name' })`, `Email`, `Phone`, `Subject`
  - `page.getByRole('contentinfo')` for footer scoping
- Fallback selector that passed:
  - `page.locator('#description')` for the contact Message textarea because it is unnamed in the captured ARIA snapshot.
- Selector caveats:
  - Non-exact `Book Now`/`Book Now` locators are ambiguous; use `exact: true`.
  - Address/contact text appears in multiple regions; scope to `#location` or footer before using text assertions.
  - Check In and Check Out date inputs were unnamed in the ARIA snapshot; the current page object uses `page.getByRole('textbox').nth(0)` and `.nth(1)`.

## Run 2026-05-09T235844Z

- Confirmed selector fix in passing tests:
  - `page.getByRole('link', { name: 'Book Now', exact: true })` for the hero CTA.
  - `page.getByRole('link', { name: 'Book now', exact: true }).nth(0..2)` for room reservation links.
- Non-exact role matching caused strict-mode failures because Playwright matched the hero `Book Now` link together with room `Book now` links.
- Date input locators remain positional (`page.getByRole('textbox').nth(0)` and `.nth(1)`) because the Check In/Check Out controls are unnamed in the ARIA snapshot.
- `page.locator('#description')` remains the documented CSS fallback for the unnamed Message textarea and passed in contact form tests.

## Run 2026-05-10T004617Z

- Confirmed selectors that passed in Gherkin-sourced Playwright tests:
  - `page.getByRole('navigation')` scoped header section links.
  - `page.getByRole('link', { name: 'Book Now', exact: true })` for the hero CTA.
  - `page.getByRole('link', { name: 'Book now', exact: true }).nth(0..2)` for repeated room booking options.
  - `page.getByTestId('ContactName')`, `ContactEmail`, `ContactPhone`, `ContactSubject`, and `ContactDescription` for contact form fields.
  - `page.getByRole('button', { name: 'Check Availability' })` and `page.getByRole('button', { name: 'Submit' })` for public action buttons.
- Date input locators remain positional textboxes (`nth(0)` and `nth(1)`) because no stable label/test id was discovered for Check In and Check Out.

## Run 2026-05-10T132304Z

- Confirmed selectors that passed in 10 Gherkin-sourced contact-message tests:
  - `page.getByTestId('ContactName')`, `ContactEmail`, `ContactPhone`, `ContactSubject`, `ContactDescription` for all 5 contact form fields.
  - `page.getByRole('button', { name: 'Submit' })` for the Submit button (asserted visible + enabled, not clicked).
  - `page.getByRole('heading', { name: 'Contact Information', level: 3 })` for the contact info section.
  - `page.getByRole('heading', { name: 'Send Us a Message', level: 3 })` for the contact form section.
  - `page.getByRole('alert')` confirmed present as an empty live-region container.
- All 25 normalized selectors from the 2026-05-10T132304Z run match the approved page object with zero drift.
- `syntheticEmail()` runtime helper correctly resolved `contact-message-2026-05-10T132304Z@example.test` using the `PLAYWRIGHT_RUN_ID` env var.

## Run 2026-05-14T130209Z

- Confirmed selectors that passed in the `location-contact-info` flow:
  - `page.locator('#location').getByText('Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA')` — address text scoped to `#location` per R05.
  - `page.locator('#location').getByText('012345678901')` — phone text scoped to `#location` per R05.
  - `page.locator('#location').getByText('fake@fakeemail.com')` — email text scoped to `#location` per R05.
  - `page.locator('#location').getByRole('link', { name: 'Pigeon' })` — map attribution link scoped to `#location`.
  - `page.locator('#location').getByRole('link', { name: 'OpenStreetMap' })` — map attribution link scoped to `#location`.
  - `page.getByRole('heading', { name: 'Our Location', level: 2 })` — location section heading.
  - `page.getByRole('heading', { name: 'Contact Information', level: 3 })` — contact info sub-heading.
- `#location`-scoped text locators avoid strict-mode failures from duplicate footer contact content without requiring `.first()` workarounds.
- Scoped locators defined as page object fields (`locationAddressText`, `locationPhoneText`, `locationEmailText`) keep test specs clean and maintainable.

## Run 2026-05-17T092115Z

- Confirmed selectors that passed in the `policy-links` flow:
  - `page.getByRole('contentinfo')` — footer landmark for scoping policy links.
  - `page.getByRole('contentinfo').getByRole('link', { name: 'Cookie-Policy' })` — footer cookie policy link.
  - `page.getByRole('contentinfo').getByRole('link', { name: 'Privacy-Policy' })` — footer privacy policy link.
- Confirmed href assertions:
  - Cookie policy link has raw `href` `/cookie`.
  - Privacy policy link has raw `href` `/privacy`.
- CSS href selectors such as `a[href="/cookie"]` and text-only locators were not needed because footer-scoped role locators were stable and passed.

## Run 2026-05-17T094218Z

- Confirmed selectors that passed in the `room-search` flow:
  - `page.locator('section#booking')` — booking section scope for availability controls.
  - `page.locator('section#booking').locator('input').nth(0)` — Check In date input.
  - `page.locator('section#booking').locator('input').nth(1)` — Check Out date input.
  - `page.getByRole('button', { name: 'Check Availability' })` — availability query button.
  - `page.getByRole('heading', { name: 'Our Rooms', level: 2 })` — room results heading.
  - `page.getByRole('heading', { name: 'Single', level: 5 })`, `Double`, and `Suite` — room option headings.
  - `page.getByRole('link', { name: 'Book now', exact: true }).nth(0..2)` — room booking links, asserted only.
- Confirmed href assertions:
  - Single room link has raw `href` `/reservation/1?checkin=2026-05-24&checkout=2026-05-25`.
  - Double room link has raw `href` `/reservation/2?checkin=2026-05-24&checkout=2026-05-25`.
  - Suite room link has raw `href` `/reservation/3?checkin=2026-05-24&checkout=2026-05-25`.
- The scoped CSS fallback for booking date inputs remains necessary because the captured ARIA snapshot exposes visible label text but no reliable programmatic accessible name for the inputs.

## Run 2026-05-17T120959Z

- Confirmed selectors that passed in the `public-home` flow:
  - `page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B', level: 1 })` — h1 welcome heading, unique on page.
  - `page.getByRole('link', { name: 'Rooms' })` — public navigation link to `/#rooms`.
  - `page.getByRole('link', { name: 'Booking' })` — public navigation link to `/#booking`.
  - `page.getByRole('link', { name: 'Amenities' })` — public navigation link to `/#amenities`.
  - `page.getByRole('link', { name: 'Location' })` — public navigation link to `/#location`.
  - `page.getByRole('link', { name: 'Contact' })` — public navigation link to `/#contact`.
  - `page.getByRole('link', { name: 'Shady Meadows B&B' })` — brand logo/home link.
- All 7 selectors are P1 `getByRole` with zero CSS, XPath, or text fallbacks.
- Navigation links are page-scoped (not navigation-scoped) for maximum compatibility with the shared monolithic `AutomationInTestingPage` page object.
- The Admin link (`getByRole('link', { name: 'Admin' })`) exists on the page but was explicitly excluded from assertions — admin access is out of scope.
- `goto('/')` is the correct explicit navigation for home page tests; the page object default `/#booking` is preserved for backward compatibility with section-navigation and room-search flows.

## Run 2026-05-17T142233Z

- Confirmed selectors that passed in the `public-home` flow:
  - `page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B', level: 1 })` — h1 welcome heading, unique on page.
  - `page.getByRole('link', { name: 'Rooms' })` — public navigation link to `/#rooms`.
  - `page.getByRole('link', { name: 'Booking' })` — public navigation link to `/#booking`.
  - `page.getByRole('link', { name: 'Amenities' })` — public navigation link to `/#amenities`.
  - `page.getByRole('link', { name: 'Location' })` — public navigation link to `/#location`.
  - `page.getByRole('link', { name: 'Contact' })` — public navigation link to `/#contact`.
  - `page.getByRole('link', { name: 'Shady Meadows B&B' })` — brand logo/home link.
- All 7 selectors are still P1 `getByRole` with zero CSS, XPath, or text fallbacks.
- `welcomeHeading` and `brandLink` aliases were added to the shared page object for readability in the `public-home` spec.
- The `public-home` spec uses explicit `goto('/')` and read-only visibility assertions only.

## Run 2026-05-17T155137Z

- Confirmed selectors that passed in the `room-search` flow:
  - `page.getByRole('navigation').getByRole('link', { name: 'Booking' })` — entry point to `/#booking` from the shared page object.
  - `page.locator('section#booking').locator('input').nth(0)` — Check In input.
  - `page.locator('section#booking').locator('input').nth(1)` — Check Out input.
  - `page.getByRole('button', { name: 'Check Availability' })` — availability action button.
  - `page.getByRole('heading', { name: 'Our Rooms', level: 2 })` — results heading.
  - `page.getByRole('heading', { name: 'Single', level: 5 })`, `Double`, and `Suite` — room option headings.
  - `page.getByRole('link', { name: 'Book now', exact: true })` — repeated room booking links, asserted only.
- Confirmed href assertions:
  - Single room link href `/reservation/1?checkin=2026-05-24&checkout=2026-05-25`.
  - Double room link href `/reservation/2?checkin=2026-05-24&checkout=2026-05-25`.
  - Suite room link href `/reservation/3?checkin=2026-05-24&checkout=2026-05-25`.
- The booking date inputs remain positional CSS fallbacks scoped to `section#booking` because the ARIA snapshot still did not expose stable accessible names.
- The shared page object's room-search constants now reflect the new resolved dates from this run.

## Run 2026-05-31T104819Z

- Confirmed selectors that passed in the `policy-links` flow:
  - `page.getByRole('contentinfo').getByRole('link', { name: 'Cookie-Policy' })` — footer cookie policy link.
  - `page.getByRole('contentinfo').getByRole('link', { name: 'Privacy-Policy' })` — footer privacy policy link.
- Confirmed href assertions:
  - Cookie policy link href `/cookie`.
  - Privacy policy link href `/privacy`.
- Footer-scoped role locators are the canonical strategy per R17; no CSS fallbacks needed.
- Zero drift from prior `policy-links` runs — selectors, hrefs, and page structure all stable.

## Run 2026-06-03T063055Z

- Confirmed selectors that passed in the `public-home` flow:
  - `page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B', level: 1 })` — h1 welcome heading.
  - `page.getByRole('link', { name: 'Shady Meadows B&B' })` — brand logo/home link.
  - `page.locator('nav').getByRole('link', { name: 'Rooms' })` — navigation-scoped Rooms link.
  - `page.locator('nav').getByRole('link', { name: 'Booking' })` — navigation-scoped Booking link.
  - `page.locator('nav').getByRole('link', { name: 'Amenities' })` — navigation-scoped Amenities link.
  - `page.locator('nav').getByRole('link', { name: 'Location' })` — navigation-scoped Location link.
  - `page.locator('nav').getByRole('link', { name: 'Contact' })` — navigation-scoped Contact link.
- All 7 selectors are P1 `getByRole` with zero CSS, XPath, or text fallbacks.
- Navigation links are now navigation-scoped (`page.locator('nav').getByRole(...)`) for improved precision.
- Zero drift from prior `public-home` runs — all selectors remain stable.
- Default availability dates observed: Check In `03/06/2026`, Check Out `04/06/2026`.
- Room reservation links target `/reservation/1?checkin=2026-06-03&checkout=2026-06-04`, `/reservation/2?checkin=2026-06-03&checkout=2026-06-04`, `/reservation/3?checkin=2026-06-03&checkout=2026-06-04`.
