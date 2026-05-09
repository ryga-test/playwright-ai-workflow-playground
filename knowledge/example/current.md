# Current Knowledge: example

Generated active summary for future pipeline runs.

## Active Truth

- Example app is a static HTML app served from `apps/example/index.html`.
- Expected local base URL is `http://localhost:3000`, usually via `EXAMPLE_BASE_URL`.
- The static server must be running before browser tests or discovery.
- If Step 1 writes `baseUrl: null`, discovery and selector extraction should be treated as blocked until `.env` or the required env var is supplied.
- Current page object: `ExamplePage` in `src/pages/example/example.page.ts`.
- Current spec: `tests/example/example.spec.ts` imports `test` and `expect` from `@fixtures/base.fixture.js`.
- Current stable selector strategy is role-first (`getByRole`) for landmarks, navigation links, form, inputs, button, status region, table, rows, and cells.
- Verified core behavior: page landmarks render, anchor navigation targets sections, form status updates and falls back to `Unnamed user`, re-submit replaces prior status, and table service/status content remains stable.

See `knowledge.md`, `rules.md`, and `selector-notes.md` for verified source entries.

## Latest Run

`2026-05-09T123839Z`: 9/9 tests passed, 0 fix cycles. Discovery/selector extraction were blocked by missing `.env`, but test execution passed after supplying `EXAMPLE_BASE_URL=http://localhost:3000` directly and starting the static server.

## Pruning Status

No entries have been archived yet. Automated pruning follows `knowledge/PRUNING_POLICY.md`.
