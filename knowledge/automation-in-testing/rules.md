# Automation in Testing — Actionable Rules

> **⚠️ Append-only file.** Add new rules under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate rules already present in the file.

---

## Human-Curated

### R01 — First run is read-only smoke

- **Rule**: The first pipeline run for `automation-in-testing` should generate read-only public smoke coverage only.
- **Allowed**: page load, headings, navigation, room/listing visibility, form presence, field visibility, non-submitting validation.
- **Avoid in first run**: final booking submission, contact form submission, admin/login attempts, payment flows, email/SMS dependent assertions.
- **Rationale**: Establish stable selectors and baseline page behavior before adding state-changing demo flows.

### R02 — Later safe demo submissions are allowed

- **Rule**: From the second run onward, safe demo booking/contact submissions may be added with obvious test data.
- **Constraints**: Do not use real credentials, real payment data, or assertions that depend on external email/SMS delivery.
- **Rationale**: The site is intended for practice, but state-changing flows should be introduced after a stable read-only baseline exists.

### R03 — Treat public-site instability as environment/app limitation

- **Rule**: If failures are caused by the public site being down, slow, rate-limited, or externally changed, classify as blocker/app limitation rather than immediately rewriting tests.
- **Rationale**: This app is an external live dependency, not a controlled local fixture.

---

## Runs

*(Populated by pipeline runs.)*

## Run 2026-05-09T135109Z

### R04 — Use exact matching for Book Now/Book now links

- **Rule**: Use `getByRole('link', { name: 'Book Now', exact: true })` for the hero CTA and `getByRole('link', { name: 'Book now', exact: true }).nth(...)` for room booking links.
- **Rationale**: Playwright role name matching is case-insensitive/fuzzy enough that non-exact `Book Now` can match the repeated room `Book now` links and cause strict-mode failures.

### R05 — Scope duplicate text assertions

- **Rule**: Scope duplicate content assertions to a stable region or section when possible, e.g. use `page.locator('#location').getByText(...)` for location contact text.
- **Rationale**: Address/contact copy appears in multiple regions including location and footer; unscoped text locators can violate strict mode.

### R06 — Prefer visibility over viewport assertions for hash-anchor navigation

- **Rule**: For same-page anchor navigation on this public site, assert target section visibility instead of `toBeInViewport()` unless viewport position is the behavior under test.
- **Rationale**: Hash navigation can leave headings outside the viewport ratio expected by Playwright while the section remains present and usable.

### R07 — Keep first-run contact and booking interactions non-submitting

- **Rule**: First-run tests may fill availability/contact fields and inspect reservation hrefs, but should not click room reservation links, submit contact forms, or enter admin credentials.
- **Rationale**: This preserves the human-curated read-only smoke policy while still validating interactive controls.

## Run 2026-05-09T235844Z

### R08 — Reconfirm date-sensitive defaults per run

- **Rule**: Treat availability default dates and reservation-link query parameters as run-sensitive observations; update expected values from the current discovery snapshot.
- **Rationale**: The public site advances default check-in/check-out dates over time.

### R09 — Availability search is safe, reservation completion is not implicit

- **Rule**: It is safe to click `Check Availability` with obvious test dates when asserting that room options remain visible, but do not click through and complete a reservation unless that state-changing flow is explicitly in scope.
- **Rationale**: This validates an interactive control while preserving public-demo safety boundaries.

## Run 2026-05-10T004617Z

### R10 — Treat approved Gherkin as the behavioral source

- **Rule**: For `automation-in-testing`, generate Playwright specs from the approved `.feature` file and preserve one-test-per-scenario or one-test-per-example-row traceability.
- **Rationale**: The 2026-05-10 run passed with Gherkin-sourced tests and scenario coverage as the review contract.

### R11 — Keep read-only contact preparation non-submitting unless state-changing scope is approved

- **Rule**: It is safe to fill contact fields with obvious test data and assert retained values, but do not click Submit unless a state-changing contact flow is explicitly approved for the run.
- **Rationale**: This validates contact form interactivity while preserving public-demo safety boundaries.

## Run 2026-05-10T122428Z

### R12 — Keep room-search reservation links assertion-only

- **Rule**: For the `room-search` flow, assert that room `Book now` options are visible after availability search, but do not click those links unless a reservation/checkout flow is explicitly approved.
- **Rationale**: The flow's success criteria require visible room booking options while remaining outside checkout.

### R13 — Use positional locators for unlabeled availability date fields only within the booking flow

- **Rule**: The availability date fields may use the first and second textbox locators within the room-search page object until stable labels, ids, or test ids become available.
- **Rationale**: The discovered ARIA snapshot exposes the check-in and check-out inputs as unnamed textboxes with no stable accessible labels or test ids.

## Run 2026-05-10T132304Z

### R14 — Prefer `getByTestId` for contact form fields

- **Rule**: Use `page.getByTestId('ContactName')`, `ContactEmail`, `ContactPhone`, `ContactSubject`, and `ContactDescription` for all contact form interactions.
- **Rationale**: These `data-testid` selectors are confirmed stable and passing across 4 pipeline runs (2026-05-10T004617Z through 2026-05-10T132304Z). They are more reliable than role-based textbox name matching for the unnamed Message textarea.

## Run 2026-05-14T130209Z

### R15 — Scope location contact detail locators to `#location` via page object

- **Rule**: Define `#location`-scoped locators on the shared page object (e.g., `this.locationAddressText = page.locator('#location').getByText(...)`) rather than using unscoped `page.getByText().first()` in specs.
- **Rationale**: Contact text (address, phone, email) appears in both `#location` and the footer. Scoping via page object fields keeps assertions clean and avoids `.first()` workarounds that are fragile to DOM order changes.

## Run 2026-05-17T092115Z

### R16 — Keep policy-link checks assertion-only

- **Rule**: For the `policy-links` flow, assert that the footer `Cookie-Policy` and `Privacy-Policy` links are visible and expose `/cookie` and `/privacy` hrefs, but do not click those links unless loading policy pages is explicitly in scope.
- **Rationale**: The flow goal is to verify public link visibility and destinations without navigating away, and the flow marks loading policy pages out of scope.

### R17 — Scope policy links to the footer landmark

- **Rule**: Use footer-scoped role locators for policy links, e.g. `page.getByRole('contentinfo').getByRole('link', { name: 'Cookie-Policy' })` and `Privacy-Policy`.
- **Rationale**: Role locators preserve accessibility alignment, and footer scoping protects generated tests from future duplicate policy links elsewhere on the page.

## Run 2026-05-17T094218Z

### R18 — Assert room-search hrefs without entering reservation

- **Rule**: For the `room-search` flow, it is safe to assert room `Book now` link visibility and raw `href` values after availability search, but generated tests must not click those links unless a reservation/checkout flow is explicitly approved.
- **Rationale**: Reservation hrefs prove date propagation into available room options while preserving the flow boundary that checkout is out of scope.

### R19 — Scope room-search date inputs to the booking section

- **Rule**: Use `section#booking`-scoped input locators for Check In and Check Out until stable accessible names, ids, or test ids are available.
- **Rationale**: The latest discovery still exposes the booking date inputs as unnamed textboxes; section scoping reduces ambiguity compared with unscoped positional textbox locators.

## Run 2026-05-17T142233Z

### R20 — Public-home should use the home route explicitly

- **Rule**: For the `public-home` smoke flow, `goto('/')` is the canonical entry point; do not rely on the page object's `/#booking` default.
- **Rationale**: The flow only validates the home page intro/navigation, and explicit home navigation reduces incidental dependence on booking state.

### R21 — Public-home selectors should stay role-based and visibility-only

- **Rule**: Keep `public-home` assertions limited to `getByRole` heading/link locators and `toBeVisible()` checks for the welcome heading, public nav links, and brand link.
- **Rationale**: The flow is read-only smoke coverage and passed without any fallback selectors or interactions.

### R22 — Expose friendly aliases for home-page assertions

- **Rule**: The shared page object should expose `welcomeHeading` and `brandLink` aliases for the public-home flow alongside the existing heading/home-link locators.
- **Rationale**: These aliases keep the `public-home` spec readable without introducing new selector strategies.

## Run 2026-05-17T155137Z

### R23 — Room-search should keep reservation links assertion-only

- **Rule**: For the `room-search` flow, assert room `Book now` link visibility and hrefs after availability search, but do not click those links unless a reservation/checkout flow is explicitly approved.
- **Rationale**: The flow validates date propagation into room options while remaining outside checkout.

### R24 — Room-search date inputs stay section-scoped

- **Rule**: Continue using `section#booking`-scoped positional input locators for Check In and Check Out until stable labels or test ids are available.
- **Rationale**: The booking inputs still require scoped fallback selectors and the current run confirmed they remain stable enough for the selected flow.
