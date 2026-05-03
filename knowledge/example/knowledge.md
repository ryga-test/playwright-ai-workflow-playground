# Example App — Verified Knowledge

> **⚠️ Append-only file.** Add new observations under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate observations already present in the file.

---

## Human-Curated

*(No human-curated entries yet.)*

---

## Run 2026-04-30T093928Z

**Source**: Pipeline run — all 7 tests passed (0 failures).

### Application URL

- Base URL: `http://localhost:3000`
- Environment variable: `EXAMPLE_BASE_URL` (default: `http://localhost:3000`)
- Static HTML app served from `apps/example/index.html`
- No `.env` file required — falls back to default URL

### Page Structure

- Single page with two sections: "Profile Settings" and "Application Status"
- Primary navigation bar (`<nav aria-label="Primary navigation">`) contains Dashboard and Settings links (both anchor links: `#dashboard`, `#settings`)
- Page heading: "Workflow Playground Dashboard" (h1)
- Section headings: "Profile Settings" (h2), "Application Status" (h2)

### Interactive Elements (all verified via passing tests)

#### Navigation
| Element | Locator Strategy | Verified Locator |
|---------|:---------------:|------------------|
| Dashboard link | getByRole (P1) | `getByRole('link', { name: 'Dashboard' })` |
| Settings link | getByRole (P1) | `getByRole('link', { name: 'Settings' })` |

#### Profile Form
| Element | Locator Strategy | Verified Locator |
|---------|:---------------:|------------------|
| Form container | getByRole (P1) | `getByRole('form', { name: 'Profile settings form' })` |
| Display name input | getByRole (P1) | `getByRole('textbox', { name: 'Display name' })` |
| Email address input | getByRole (P1) | `getByRole('textbox', { name: 'Email address' })` |
| Save Changes button | getByRole (P1) | `getByRole('button', { name: 'Save Changes' })` |
| Status message | getByRole (P1) | `getByRole('status')` |

#### Status Table
| Element | Locator Strategy | Verified Locator |
|---------|:---------------:|------------------|
| Table | getByRole (P1) | `getByRole('table', { name: 'Application status table' })` |
| All rows | getByRole (P1) | `table.getByRole('row')` |
| Row by service name | getByRole (P1) | `table.getByRole('row', { name: 'Example API Online' })` etc. |
| Cell in row | getByRole (P1) | `row.getByRole('cell', { name: 'Online' })` etc. |

### Locator Strategy Summary

- **100% Priority 1 (`getByRole`) coverage** — no fallback strategies needed
- No `data-testid` attributes exist on the page (Priority 2 unavailable)
- `getByLabel` also works for inputs but was superseded by `getByRole('textbox', { name })` per priority ladder
- `getByPlaceholder` also resolves inputs (`Ada Lovelace`, `ada@example.test`) but was superseded

### Form Behavior (verified)

- Initial status message: "No changes saved yet."
- Submit with values: status reads `Saved changes for <display name>.`
- Submit with empty display name: status reads `Saved changes for Unnamed user.`
- Form uses `preventDefault()` — no page reload on submit
- Status region is `aria-live="polite"` with `role="status"`

### Table Content (verified)

| Service | Status |
|---------|--------|
| Example API | Online |
| Worker Queue | Healthy |
| Notification Service | Paused |

- Table has 4 rows total (1 header + 3 data)
- Row accessible names are concatenated cell texts: "Example API Online", "Worker Queue Healthy", "Notification Service Paused"

### Playwright Config

- Module resolution: `NodeNext` → imports use `.js` extension or `@pages/*` path alias
- `baseURL` derived from `EXAMPLE_BASE_URL` env var (or default `http://localhost:3000`)
- `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`

---

## Run 2026-04-30T094508Z

**Source**: Pipeline run — all 8 tests passed (0 failures).

### New Verified Observations (not documented in prior runs)

#### Alternative Input Locator: `getByLabel` (P2)
- **Display name input**: `getByLabel('Display name')` resolves correctly and is the Playwright-recommended strategy for labeled form inputs.
- **Email address input**: `getByLabel('Email address')` resolves correctly.
- Both strategies (`getByRole('textbox', { name })` and `getByLabel()`) work — `getByLabel` is preferred per Playwright docs for inputs with associated `<label>` elements.

#### Table Row: Partial Name Matching
- `row('Example API')` matches the row using substring/contains semantics — does NOT require the full concatenated accessible name (`'Example API Online'`).
- Same for `row('Worker Queue')` and `row('Notification Service')`.
- This is more resilient: adding a 3rd column won't break the row match.

#### Table Cell: Columnar Access via `cellAt()`
- `cellAt(row, colIndex)` using `row.locator('td').nth(colIndex)` works correctly.
- Column 0 = Name, Column 1 = Status. Verified via `toHaveText('Online')`, `toHaveText('Healthy')`, `toHaveText('Paused')`.

#### Table Data Rows Count
- `dataRows` (targeting `tbody tr`) returns 3 — excludes the header row.
- Contrast: querying `table.getByRole('row')` returns 4 (includes header).

#### Navigation Anchor Link Behavior
- `clickDashboardLink()` clicks the Dashboard nav link (`href="#dashboard"`) — page scrolls to top, heading remains visible.
- `clickSettingsLink()` clicks the Settings nav link (`href="#settings"`) — scrolls to Application Status section.
- `toBeInViewport()` assertion successfully verifies the target section is scrolled into view.

#### Form Field Clear and Re-Submit
- `.clear()` on inputs works correctly — fields become empty.
- Re-submitting with new values (`'Charles Babbage'`, `'charles@example.test'`) overwrites the previous status message.
- `not.toContainText()` assertion verifies the old name is absent from the status after re-submit.

#### Empty Input Assertion
- `toHaveValue('')` assertion correctly verifies an input is empty on initial page load.
- More precise than checking placeholder text — validates actual input state.

#### Page Object API Surface (this run)
| Property | Type | Locator |
|----------|------|---------|
| `heading` | Locator | `getByRole('heading', { name: 'Workflow Playground Dashboard', level: 1 })` |
| `profileHeading` | Locator | `getByRole('heading', { name: 'Profile Settings', level: 2 })` |
| `statusHeading` | Locator | `getByRole('heading', { name: 'Application Status', level: 2 })` |
| `nameHeader` | Locator | `getByRole('columnheader', { name: 'Name' })` |
| `statusHeader` | Locator | `getByRole('columnheader', { name: 'Status' })` |
| `dataRows` | Locator | `table.locator('tbody tr')` (CSS fallback for iteration) |
| `submitProfile(name, email)` | Method | Returns the display name (or `'Unnamed user'` if empty) |
| `fillName(name)` | Method | Fills only the display name input |
| `fillEmail(email)` | Method | Fills only the email input |
| `clickDashboardLink()` | Method | Clicks the Dashboard nav link |
| `clickSettingsLink()` | Method | Clicks the Settings nav link |
| `row(service)` | Method | Finds a table row by partial service name match |
| `cellAt(row, col)` | Method | Gets a cell at a column index within a row |

---

## Run 2026-05-01T022310Z

**Source**: Pipeline run — 9/9 tests passed (0 failures).

### New Verified Observations (not documented in prior runs)

#### Serial Form Submissions (S09)
- Three sequential profile submits (Alan Turing → Grace Hopper → Margaret Hamilton) correctly overwrite the status message each time.
- After the final submit, `not.toContainText()` confirms neither `'Alan Turing'` nor `'Grace Hopper'` appears in the status — only the most recent submission remains.
- No stale state leakage across 3 rapid-fire submits.

#### Input Value Retention After Submit (S03)
- Form inputs retain their filled values after submission. `toHaveValue('Ada Lovelace')` and `toHaveValue('ada@example.test')` both pass after `submitProfile()`.
- The form's `preventDefault()` handler prevents navigation but does NOT clear input fields. This is distinct from the clear-and-re-submit behavior (S08/R15) which requires explicit `.clear()` calls.

#### Cross-Run Locator Reliability
- All 15 role-based selectors resolved correctly across 9 tests with zero locator failures.
- P1 (`getByRole`) remains 100% reliable for this app across 3 consecutive pipeline runs (24 total tests, 0 locator failures).

---

## Run 2026-05-01T025318Z

**Source**: Pipeline run — 9/9 tests passed (1 script bug fixed, 0 app bugs).

### New Verified Observations (not documented in prior runs)

#### Page Object API v2 (`ExampleAppPage`)

This run introduced a redesigned page object with renamed properties and methods:

| v2 Property | v1 Equivalent | Type |
|-------------|---------------|------|
| `pageHeading` | `heading` | Locator — h1 |
| `tableHeading` | `statusHeading` | Locator — "Application Status" h2 |
| `nameColumnHeader` | `nameHeader` | Locator |
| `statusColumnHeader` | `statusHeader` | Locator |
| `settingsForm` | `profileForm` | Locator — form container |

| v2 Method | v1 Equivalent | Behavior |
|-----------|---------------|----------|
| `goToDashboard()` | `clickDashboardLink()` | Clicks Dashboard nav link |
| `goToSettings()` | `clickSettingsLink()` | Clicks Settings nav link |
| `fillProfileForm(name, email)` | `fillName()` + `fillEmail()` | Fills both inputs in one call |
| `saveProfile()` | `clickSave()` or implicit in `submitProfile()` | Clicks Save Changes button |
| `updateProfile(name, email)` | `submitProfile(name, email)` | **Returns full status text**, not just name |
| `getCell(name)` | `cellAt(row, col)` | Direct cell lookup by accessible name |
| `getTableRows()` | `dataRows` | Returns `tbody tr` locator (3 data rows) |

#### `updateProfile()` Returns Full Status Text
- `updateProfile('Ada Lovelace', 'ada@example.test')` returns `"Saved changes for Ada Lovelace."` — the complete `textContent()` of the status element.
- This differs from v1's `submitProfile()` which returned only the display name.
- **Assertion guidance**: Use `expect(name).toContain('Ada Lovelace')` rather than `.toBe('Ada Lovelace')`.

#### `getCell()` by Accessible Name
- `getCell('Example API')` resolves the cell with accessible name "Example API" anywhere in the table.
- `getCell('Online')` resolves the "Online" status cell.
- All 6 cells (3 services × 2 statuses) verified across S09.
- This is a simpler alternative to the row+column pattern (`row() + cellAt()`).

#### Screencast Video Recording
- The base fixture (`@fixtures/base.fixture.js`) automatically records per-test screencast videos when `PLAYWRIGHT_RUN_ID` is set.
- Videos include **action annotations** (red dots + labels on clicks/fills) and **chapter overlays** (test name at start, pass/fail status at end).
- 9 individual `.webm` files generated (~300–500 KB each), concatenated into `screencast.webm` (3.2 MB).
- Duration: ~73 seconds for all 9 tests.

#### Test Import Pattern
- Tests import `test` and `expect` from `@fixtures/base.fixture.js` (NOT from `@playwright/test`):
  ```typescript
  import { test, expect } from '@fixtures/base.fixture.js';
  ```
- This enables the screencast recording, app-level fixtures (`appConfig`), and baseURL resolution.

#### Cross-Run Locator Reliability (4th Run)
- All 13 page object locators resolved correctly across 9 tests with zero locator failures.
- P1 (`getByRole`) remains 100% reliable across **4 consecutive pipeline runs** (33 total tests, 0 locator failures).

---

## Run 2026-05-01T212504Z

**Source**: Pipeline run — 9/9 tests passed (0 script bugs, 0 app bugs).

### New Verified Observations (not documented in prior runs)

#### Cross-Run Locator Reliability (5th Run)
- P1 (`getByRole`) remains 100% reliable across **5 consecutive pipeline runs** (42 total tests, 0 locator failures).
- This is the longest unbroken streak of locator reliability recorded for this app.

#### First Clean Pass — Zero Fix Cycles
- All 9 tests passed on the first execution with no script bugs requiring fixes.
- Previous run (2026-05-01T025318Z) required 1 script bug fix. This run needed none,
  indicating the v2 page object API and test spec patterns are mature and stable.

#### v2 API Consistency (2nd Run)
- The v2 page object API (`updateProfile()` returning full status text, `getCell()`
  for direct cell access, `getTableRows()` for `tbody tr`) continues to perform
  correctly across all 9 tests with no regressions.

---

## Run 2026-05-02T061759Z

**Source**: Pipeline run — 9/9 tests passed after resolving 1 infrastructure blocker (0 script bugs, 0 app bugs).

### New Verified Observations

#### Page Object API v3 (`ExamplePage`)

This run promoted and verified a renamed page object class:

| v3 Property / Method | Type | Verified behavior |
|---|---|---|
| `pageHeading` | Locator | h1 "Workflow Playground Dashboard" is visible. |
| `primaryNavigation` | Locator | Named navigation landmark "Primary navigation" is visible. |
| `profileSettingsRegion` | Locator | Region "Profile Settings" is visible and targetable. |
| `applicationStatusRegion` | Locator | Region "Application Status" is visible and targetable. |
| `profileSettingsForm` | Locator | Form "Profile settings form" is visible. |
| `displayNameInput` | Locator | Labelled input is visible, empty initially, fillable, clearable, and retains submitted value. |
| `emailAddressInput` | Locator | Labelled input is visible, empty initially, fillable, clearable, and retains submitted value. |
| `saveChangesButton` | Locator | Button submits the form. |
| `statusMessage` | Locator | Status region shows initial, success, fallback, and replacement messages. |
| `applicationStatusTable` | Locator | Named table is visible. |
| `statusRow(service, status)` | Method | Resolves full service/status rows by accessible row name. |
| `statusCell(name)` | Method | Resolves individual table cells by accessible name. |

#### GWT Spec Structure

- All 9 approved GWT scenarios map 1:1 to Playwright `test()` blocks.
- Each test uses explicit `// Given`, `// When`, and `// Then` sections.
- Tests import `test` and `expect` from `@fixtures/base.fixture.js`, preserving screencast recording and app fixture behavior.

#### Infrastructure Retry

- Initial test execution failed 9/9 with `net::ERR_CONNECTION_REFUSED` because `http://localhost:3000/` was not serving the app.
- Starting `python3 -m http.server 3000 --directory apps/example` resolved the blocker.
- Re-run passed 9/9 without changing app code or test/spec code.

#### Cross-Run Locator Reliability (6th Run)

- All page object locators resolved correctly across 9 tests with zero locator failures.
- The example app now has 6 consecutive successful pipeline runs with reliable accessible locators after infrastructure is available.

---

## Run 2026-05-03T021118Z

**Source**: Pipeline run — 9/9 tests passed (0 fix cycles, 0 script bugs, 0 app bugs, 0 blockers).

### New Verified Observations

#### Clean End-to-End Pipeline

- Steps 1–8 completed for the example app using run ID `2026-05-03T021118Z`.
- Step 6 typecheck passed immediately after spec generation.
- Step 7 test execution passed 9/9 on the first run, with no repair cycle required.
- Combined screencast video was generated at `results/example/2026-05-03T021118Z/step7-run-fix/screencast.webm`.

#### Current Page Object and Spec Remain Stable

- The current `ExamplePage` class and generated spec remain valid for all 9 approved GWT scenarios.
- Verified API surface: `goto`, `openSettingsSection`, `openDashboardSection`, `fillProfile`, `saveProfile`, `updateProfile`, `statusRow`, and `statusCell`.
- The spec imports `test` and `expect` from `@fixtures/base.fixture.js`, preserving pipeline screencast behavior.

#### Cross-Run Locator Reliability (7th Run)

- All page object locators resolved correctly across 9 tests with zero locator failures.
- The example app now has 7 consecutive successful pipeline runs with reliable accessible locators after infrastructure is available.
