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
  - Non-exact `Book Now`/`Book now` locators are ambiguous; use `exact: true`.
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
