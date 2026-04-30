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
