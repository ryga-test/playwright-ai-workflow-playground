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
