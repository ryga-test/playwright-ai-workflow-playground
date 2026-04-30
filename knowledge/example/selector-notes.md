# Selector Notes: example

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

*(No human-curated entries yet.)*

---

## Findings

*(Populated by pipeline runs.)*

---

## Run 2026-04-30T094508Z

### Selector Verification (8/8 passing tests)

| Element | Strategy | Selector | Verified |
|---------|----------|----------|:-------:|
| Page heading | getByRole (P1) | `getByRole('heading', { name: 'Workflow Playground Dashboard', level: 1 })` | ✅ |
| Primary nav | getByRole (P1) | `getByRole('navigation', { name: 'Primary navigation' })` | ✅ |
| Dashboard link | getByRole (P1) | `getByRole('link', { name: 'Dashboard' })` | ✅ |
| Settings link | getByRole (P1) | `getByRole('link', { name: 'Settings' })` | ✅ |
| Profile heading | getByRole (P1) | `getByRole('heading', { name: 'Profile Settings', level: 2 })` | ✅ |
| Profile form | getByRole (P1) | `getByRole('form', { name: 'Profile settings form' })` | ✅ |
| Display name input | getByLabel (P2) | `getByLabel('Display name')` | ✅ |
| Email input | getByLabel (P2) | `getByLabel('Email address')` | ✅ |
| Save button | getByRole (P1) | `getByRole('button', { name: 'Save Changes' })` | ✅ |
| Status message | getByRole (P1) | `getByRole('status')` | ✅ |
| Status heading | getByRole (P1) | `getByRole('heading', { name: 'Application Status', level: 2 })` | ✅ |
| Status table | getByRole (P1) | `getByRole('table', { name: 'Application status table' })` | ✅ |
| Name header | getByRole (P1) | `getByRole('columnheader', { name: 'Name' })` | ✅ |
| Status header | getByRole (P1) | `getByRole('columnheader', { name: 'Status' })` | ✅ |
| Data rows | CSS (P6) | `table.locator('tbody tr')` | ✅ |
| Table row | getByRole (P1) | `table.getByRole('row', { name: 'Example API' })` | ✅ |
| Cell at index | CSS (P6) | `row.locator('td').nth(N)` | ✅ |

### Strategy Distribution

| Priority | Strategy | Count | % |
|----------|----------|-------|----|
| P1 | getByRole | 13 | 76.5% |
| P2 | getByLabel | 2 | 11.8% |
| P6 | CSS | 2 | 11.8% |

### Notes
- `getByLabel` (P2) was deliberately chosen over `getByRole('textbox')` (P1) for inputs — per Playwright best practice for labeled form fields.
- `getByRole('row', { name })` uses substring matching — `'Example API'` matches row `'Example API Online'`.
- CSS fallbacks (P6) are justified: no ARIA-based locator for `tbody tr` iteration or column-index cell access.
