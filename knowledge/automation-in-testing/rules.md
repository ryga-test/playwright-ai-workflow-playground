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
