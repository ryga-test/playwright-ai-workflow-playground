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
