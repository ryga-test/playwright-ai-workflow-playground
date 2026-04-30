# Example App — Actionable Rules

> **⚠️ Append-only file.** Add new rules under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate rules already present in the file.

---

## Human-Curated

*(No human-curated entries yet.)*

---

## Run 2026-04-30T093928Z

**Source**: Pipeline run — 7/7 tests passed.

### Locator Rules

#### R01 — Always prefer `getByRole` for this app
- **Rule**: All interactive elements on the example app resolve via `getByRole` with an accessible name. Never use `getByTestId`, `getByLabel`, `getByPlaceholder`, `getByText`, or CSS/XPath unless `getByRole` is blocked by a DOM change.
- **Rationale**: 100% of elements passed Priority 1. ARIA semantics are complete and correct (semantic HTML + explicit `aria-label` attributes where needed).
- **Verified by**: All 7 passing tests (S01–S07).

#### R02 — Scope table queries to the table container
- **Rule**: When querying rows or cells, chain from the table locator: `table.getByRole('row', { name })` rather than `page.getByRole('row', { name })`. This avoids ambiguity if rows are added elsewhere on the page.
- **Rationale**: The status table has unambiguous `aria-label="Application status table"`. Scoping prevents false matches.
- **Verified by**: Tests S04, S05.

#### R03 — Use accessible row names for table row targeting
- **Rule**: Target table rows by their accessible name (concatenated cell texts): `getByRole('row', { name: 'Example API Online' })`. Do NOT use positional selectors (`nth()`, `first()`) for data rows — content order may change.
- **Rationale**: Accessible names are deterministic as long as cell text is unchanged. Positional selectors break on row reordering.
- **Verified by**: Test S05.

#### R04 — Inputs use `getByRole('textbox', { name })`, not `getByLabel`
- **Rule**: For form inputs with associated labels, use `getByRole('textbox', { name: 'Display name' })` rather than `getByLabel('Display name')`. Follows the priority ladder: `getByRole` > `getByLabel`.
- **Rationale**: Both strategies derive the accessible name from the `<label>` element. `getByRole` is higher priority and equally stable.
- **Verified by**: Tests S02, S03, S06, S07.

### Import Rules

#### R05 — Use `@pages/*` path alias with `.js` extension
- **Rule**: Import page objects as `import { ExampleDashboardPage } from '@pages/example/example.page.js'`. Do NOT use relative paths (`../../src/...`).
- **Rationale**: `tsconfig.json` sets `moduleResolution: "NodeNext"` which requires `.js` extensions. The `@pages/*` path alias is configured in `tsconfig.json`.
- **Verified by**: Compilation check (0 errors) + runtime test execution (7 passes).

### App Behavior Rules

#### R06 — Form submission is client-side only
- **Rule**: Submitting the profile form does NOT trigger a page navigation or reload. Use `expect(statusMessage).toContainText(...)` after submit — no `waitForURL` or `waitForNavigation` needed.
- **Rationale**: The form handler calls `event.preventDefault()` and updates the DOM directly.
- **Verified by**: Tests S03, S06, S07.

#### R07 — Empty display name falls back to "Unnamed user"
- **Rule**: When testing form submission with an empty display name field, expect status: `"Saved changes for Unnamed user."`.
- **Rationale**: The app's JS logic: `const name = document.getElementById('display-name').value || 'Unnamed user'`.
- **Verified by**: Test S06.

### Infrastructure Rules

#### R08 — Ensure the static server is running before test execution
- **Rule**: The example app is a static HTML file served via `python3 -m http.server 3000` or a Node.js equivalent. Tests will fail with `ERR_CONNECTION_REFUSED` if the server is not running.
- **Rationale**: No integrated dev server — the app must be served externally.
- **Verified by**: Run cycle 0 failure → cycle 1 pass after server restart.

#### R09 — `playwright.config.ts` uses `baseURL` for `page.goto('/')`
- **Rule**: Page object's `goto()` method calls `this.page.goto('/')`. This works because `playwright.config.ts` sets `use.baseURL` from the `EXAMPLE_BASE_URL` environment variable. Ensure the env var or default is correct.
- **Rationale**: Avoids hardcoded URLs in page objects and test specs.
- **Verified by**: All 7 tests navigate via `dashboard.goto()` (no absolute URLs).

---

## Run 2026-04-30T094508Z

**Source**: Pipeline run — 8/8 tests passed.

### Locator Rules

#### R10 — `getByLabel` is idiomatic for labeled form inputs
- **Rule**: For form inputs with associated `<label>` elements, `getByLabel('Display name')` is the Playwright-recommended strategy. `getByRole('textbox', { name })` also works but `getByLabel` is more semantically specific to the label association.
- **Rationale**: Playwright docs recommend `getByLabel` for form fields. Both strategies resolve the same element from the same accessible name source. This refines R04 — `getByLabel` (P2) is acceptable and idiomatic alongside `getByRole('textbox')` (P1), not a degradation.
- **Verified by**: Tests S02, S03, S04, S08.

#### R11 — Use partial service name for `row()` matching
- **Rule**: When targeting a table row, match by the service name only (e.g., `row('Example API')`) rather than the full concatenated accessible name (e.g., `'Example API Online'`). The `{ name }` option uses substring/contains semantics on the accessible name.
- **Rationale**: Partial matching is more resilient — adding a 3rd column to the table will not break the row match. Full-name matching (R03) is fragile to schema changes.
- **Verified by**: Test S05.

#### R12 — Use scoped `dataRows` for data-only row count
- **Rule**: When counting data rows (excluding header), use `locator('tbody tr')` scoped to the table. This returns 3 for the example app. `table.getByRole('row')` returns 4 (includes header).
- **Rationale**: Asserting on data-only count is more meaningful for content verification. Header-inclusive counts create brittle assertions if the header structure changes.
- **Verified by**: Test S05 (`expect(dataRows).toHaveCount(3)`).

### Assertion Rules

#### R13 — Use `toBeInViewport()` for anchor-link scroll verification
- **Rule**: After clicking an anchor link (`href="#section"`), assert the target heading is in viewport: `expect(targetHeading).toBeInViewport()`. More precise than `toBeVisible()` which passes even if scrolled off-screen.
- **Rationale**: `toBeVisible()` only checks CSS visibility, not whether the element is currently in the user's viewport. `toBeInViewport()` validates the anchor actually scrolled.
- **Verified by**: Test S07.

#### R14 — Use `toHaveValue('')` for empty input assertions
- **Rule**: Assert empty inputs with `expect(input).toHaveValue('')` rather than checking placeholder text. This validates the actual input state, not a static attribute.
- **Rationale**: Placeholder text is static and doesn't change. `toHaveValue('')` confirms the field is truly empty — relevant after `.clear()` or initial load.
- **Verified by**: Tests S02, S08.

### App Behavior Rules

#### R15 — Form inputs are clearable and re-submittable
- **Rule**: After form submission, `.clear()` on inputs works and re-submitting with new values overwrites the status message. The old name is no longer present in the status after re-submit.
- **Rationale**: The form doesn't clear itself on submit (the status message updates but fields retain values). Tests should verify that manual clearing + re-submit works correctly.
- **Verified by**: Test S08.
