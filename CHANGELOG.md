# Changelog

## 2026-05-02 — Pipeline Autonomy and Run Completion

### Changed

- **Pipeline Step 6 is now autonomous after Step 5 approval**: updated
  `.pi/prompts/pipeline-write-spec.md` so generated specs with previous
  provenance are overwritten automatically instead of triggering a third human
  approval gate.
- Existing spec overwrites must now preserve safety by writing a diff artifact to
  `results/<app>/<run>/step6-write-spec/spec.diff` and updating the provenance
  header with the current run ID.
- Human approval is now reserved for the intended gated steps only:
  - Step 4: page object review
  - Step 5: test draft review

### Pipeline Run: 2026-05-02T061759Z

- **9/9 tests passed** after resolving one infrastructure blocker
  (`ERR_CONNECTION_REFUSED` because the local static server was not running).
- **0 script bugs**, **0 app bugs**.
- Promoted approved `ExamplePage` page object and GWT spec for the example app.
- Appended verified observations to knowledge files.

### Updated files

| File | Change |
|------|--------|
| `.pi/prompts/pipeline-write-spec.md` | Step 6 no longer asks for extra overwrite approval |
| `src/pages/example/example.page.ts` | Promoted approved page object for run `2026-05-02T061759Z` |
| `tests/example/example.spec.ts` | Generated GWT spec for run `2026-05-02T061759Z` |
| `knowledge/example/knowledge.md` | Appended verified run observations |
| `knowledge/example/rules.md` | Appended autonomous pipeline and infrastructure retry rules |
| `knowledge/example/selector-notes.md` | Appended selector verification notes |
| `results/example/2026-05-02T061759Z/` | New: full pipeline artifacts and passing test report |

## 2026-05-02 — Fallow Adoption, Refactoring, and Browser Fixes

### Added

- **Fallow codebase intelligence**: installed, configured, and adopted per the
  [Fallow adoption guide](https://docs.fallow.tools/adoption).
  - **`.fallowrc.json`** with project policy (`unused-dependencies` → `error`,
    `unused-exports` → `error`).
  - **Agent hooks** (`.claude/hooks/fallow-gate.sh`, `.claude/settings.json`)
    gate every `git commit` / `git push` on `fallow audit`. Only `fail` verdicts
    block; warns pass through.
  - **Regression baselines** (`fallow-baselines/`) snapshot existing dead code,
    health, and duplication counts so audits only flag new issues.
  - **`npm run fallow`** and **`npm run fallow:health`** not needed — baseline
    approach via `fallow audit` handles incremental enforcement.
- **Self-contained browser opening in Node scripts** — dashboard/report commands
  now open the system default browser directly from Node. Linux uses
  `xdg-settings` + `gtk-launch` when available, with `xdg-open` fallback,
  avoiding the previous shell helper dependency.
- **`scripts/open-default-browser.js`** — shared Node helper for opening URLs in
  the default browser.
- **`scripts/open-report.js`** — opens `playwright-report/index.html` from Node
  and reports a clear error if the Playwright HTML report has not been generated.

### Changed

- **`scripts/generate-dashboard-data.js`** — major refactoring (Phase 2):
  - Split 3 monolithic functions (`parsePipelineSummary` 146-line/75-cyclomatic,
    `parseTestReport` 58-line/32-cyclomatic, `main` 151-line/27-cyclomatic) into
    20 focused, single-responsibility functions.
  - Health score improved from **70 B → 82 B** (+12 points).
  - Max cyclomatic complexity dropped from **75 → 17** (-77%).
  - Avg cyclomatic: 4.8 → 3.1 (-35%), P90 cyclomatic: 13 → 7 (-46%).
  - New `extractRunId` pattern matches newer pipeline-summary heading format.
- **`injectIntoHtml()`** now uses regex matching on any existing
  `window.__DASHBOARD_DATA__ = {...}` line, not just a fragile placeholder
  comment. Injection works on consecutive runs without manual reset.
- **`scripts/generate-dashboard-data.js`** now supports `--open`, making
  `npm run dashboard` regenerate/inject dashboard data and open `index.html`
  without calling an external shell helper.
- **`package.json` scripts**:
  - `dashboard` now runs `node scripts/generate-dashboard-data.js --open`.
  - `report` now runs `node scripts/open-report.js`.
  - Both commands are self-contained and no longer depend on
    `scripts/open-browser.sh`, `xdg-open`, `python3 -m webbrowser`, or
    `npx playwright show-report`.
- **`results/example/2026-05-01T212504Z/pipeline-summary.md`** — updated
  heading format to match the parser's expected `**Run**:` pattern.

### Fixed

- **Dashboard latest run detection**: new pipeline-summary format
  (`# Pipeline Summary — app / runId`) was not recognized by the parser.
  Added fallback regex pattern to `extractRunId()` and normalized the
  summary format.
- **Browser opens in Chrome/Edge instead of system default**: root cause was
  Flatpak Zen Browser failing with `CanCreateUserNamespace() EPERM`, causing
  `xdg-open` to silently fall through to Edge (the next registered text/html
  handler). Fixed by resolving the default browser and using `gtk-launch`
  directly from Node to avoid the fallback chain.
- **Placeholder injection consumed on first run**: `injectIntoHtml()` only
  matched the placeholder comment; after first injection, the placeholder
  was gone and subsequent runs would warn. Fixed with regex matching on any
  `window.__DASHBOARD_DATA__` assignment.

### Removed

- **`src/helpers/artifact-writer.ts`** — dead file (0% reachable, flagged by Fallow).
- **`src/helpers/snapshot-parser.ts`** — dead file (0% reachable, also cleared 2 complexity violations).
- **`ExampleAppPage.assertServiceStatus`** — unused class member never called in tests.
- **`dotenv` from `dependencies`** → moved to `devDependencies` where it belongs.
- **`scripts/open-browser.sh`** — removed after `report` and `dashboard` became
  self-contained Node commands.

### Pipeline Run: 2026-05-01T212504Z

- **9/9 tests passed** (S01–S09), **0 fix cycles** (clean first pass).
- 5th consecutive pipeline run with **100% P1 (`getByRole`) locator reliability**
  (42 total tests, 0 locator failures).
- First run with zero script bugs since the v2 page object API stabilized.
- Full 8-step workflow: Resolve → Discover → Extract Selectors → Draft Page
  Object → Draft Tests → Write Spec → Run & Fix → Summarize.

### Updated files

| File | Change |
|------|--------|
| `.fallowrc.json` | New: project policy + audit baseline config |
| `.claude/settings.json` | New: fallow-gate hook registration |
| `.claude/hooks/fallow-gate.sh` | New: PreToolUse hook for git commit/push gating |
| `fallow-baselines/*.json` | New: regression baselines for dead-code, health, dupes |
| `scripts/open-default-browser.js` | New: shared self-contained browser opener |
| `scripts/open-report.js` | New: self-contained report opener |
| `scripts/open-browser.sh` | Deleted: replaced by self-contained Node opener |
| `scripts/generate-dashboard-data.js` | Refactored: 20 functions, health score 70B→82B; added `--open` |
| `package.json` | Updated: self-contained report/dashboard scripts, dotenv → devDeps |
| `src/helpers/artifact-writer.ts` | Deleted: dead code |
| `src/helpers/snapshot-parser.ts` | Deleted: dead code |
| `src/pages/example/example.page.ts` | Removed `assertServiceStatus` dead method |
| `knowledge/example/knowledge.md` | Appended: 5th run streak, v2 API consistency |
| `knowledge/example/rules.md` | Appended: all 19 rules re-validated |
| `results/example/2026-05-01T212504Z/` | New: full 8-step pipeline artifacts |

## 2026-05-01 — Live Dashboard with Pipeline Data Injection

### Added

- **`index.html` — Self-contained QA dashboard** that renders a visual report
  (pass rate ring, duration trend, slowest specs, historical signal, artifacts)
  from the latest pipeline run data. Opens directly in the browser.
- **`scripts/generate-dashboard-data.js`** — scans `results/example/` for all
  completed pipeline runs, parses `pipeline-summary.md` and `test-report.md`
  from each, and builds a structured JSON payload.
- **`npm run dashboard`** — single command that regenerates the dashboard data,
  injects it inline into `index.html` (avoiding `file://` CORS restrictions),
  and opens the result in the default browser.
- **Per-run duration extraction** from pipeline summaries and test reports,
  including ms-to-seconds unit normalization and sum-of-per-test fallbacks.
- **Auto-generated historical comparison** (coverage growth, locator strategy,
  proof artifacts, fix classification) derived from actual run data trends.

### Changed

- **`index.html`** converted from static hardcoded HTML to a dynamic template
  that renders all sections from `window.__DASHBOARD_DATA__`. The build script
  replaces a placeholder with live JSON on each run.
- **`.gitignore`** now excludes `dashboard-data.js` (auto-generated reference
  artifact).

### Updated files

| File | Change |
|------|--------|
| `index.html` | Rewritten as dynamic dashboard with inline data injection |
| `scripts/generate-dashboard-data.js` | New: pipeline summary parser + HTML injector |
| `package.json` | Added `dashboard` script |
| `.gitignore` | Added `dashboard-data.js` |

## 2026-05-01 — Pipeline Reset Robustness Fix

### Fixed

- **`/pipeline-reset` no longer resurrects pipelines on restart**: replaced
  fragile `null` sentinel with an explicit `status: "aborted"` entry in the
  session history. Previously, if the session file wasn't flushed before a
  crash/force-quit, `session_start` would find the stale active pipeline
  entry and restore it.
- **`session_start` now verifies git branch before restoring**: even if a
  stale pipeline state is found in session history, it will only be restored
  if the current git branch matches the expected `pipeline/<app>/<runId>`
  branch. Otherwise it warns and suggests a fresh `/pipeline-run`.
- **`agent_end` guards against async-gap resets**: added null-pipeline
  checks after `await` points in both gate-approval and auto-advance paths,
  so a `/pipeline-reset` that fires during the 300ms yield window cannot
  trigger a dispatch.

### Changed

- **`persistState()` now always writes**, even when `pipeline` is null,
  preventing session_start from walking past the null entry to an older
  active one.
- **`PipelineState.status`** now accepts `"aborted"` as an explicit
  sentinel value.
- **Reset handler order**: writes the `"aborted"` sentinel via `persistState()`
  before clearing the in-memory `pipeline` variable.

### Updated files

| File | Change |
|------|--------|
| `.pi/extensions/pipeline-runner/index.ts` | Robust reset, branch verification, async-gap guards |

## 2026-05-01 — Per-Run Git Branch Isolation

### Added

- **Per-run git branch isolation**: `/pipeline-run <app>` now creates a dedicated
  git branch (`pipeline/<app>/<runId>`) from current HEAD, switches to it, and
  runs all pipeline steps on that branch. Each run has its own isolated commit
  history; the original branch is untouched.
- **Automatic branch cleanup on reset**: `/pipeline-reset` force-switches back
  to the original branch and deletes the pipeline branch.
- **Completion stays on pipeline branch**: after the pipeline finishes, you're
  on the pipeline branch with all generated artifacts ready to review, commit,
  and merge.

### Changed

- **`/pipeline-run` now pre-generates the run ID** before dispatching step 1.
  The runId is passed directly to the agent as a second argument — the agent
  no longer generates its own timestamp.
- **Step 1 (`/pipeline-resolve <app> <runId>`)** updated to accept the
  pre-generated runId instead of generating one.
- **`PipelineState`** now includes an `originalBranch` field so `/pipeline-reset`
  knows where to return.
- **`/pipeline-status`** now displays both the pipeline branch and the original branch.
- **Completion notification** shows both branch names and a reminder on how to
  go back or merge.

### Updated files

| File | Change |
|------|--------|
| `.pi/extensions/pipeline-runner/index.ts` | Rewritten: branch creation, checkout, cleanup |
| `.pi/prompts/pipeline-resolve.md` | Argument hint changed to `<app> <runId>` |
| `adapters/pi/capabilities.yaml` | Resolve step: pre-generated runId |
| `contracts/adapter.schema.yaml` | Resolve step signature updated |
| `specs/001-ai-e2e-framework/contracts/adapter.schema.yaml` | Resolve step signature updated |

## 2026-05-01 — Screencast Video Proof Integration

### Added

- **Per-test screencast video recording** via `page.screencast` API (Playwright v1.59+).
  Pipeline runs (`PLAYWRIGHT_RUN_ID` set) now produce one `.webm` video per test in
  `results/<app>/<run>/step7-run-fix/<test-name>.webm`.
- **Action annotations**: `page.screencast.showActions()` enables visual highlights
  (dot + label) on each click/fill/hover interaction.
- **Chapter overlays**: `page.screencast.showChapter()` adds start-of-test and
  end-of-test status overlays (title, pass/fail emoji) to the video.
- **Manifest output**: `workflows/manifest.yaml` step7 now declares `screencast-videos`
  output artifact pointing to `results/<app>/<run>/step7-run-fix/`.

### Changed

- **`src/fixtures/base.fixture.ts`**: Extended `page` fixture to manage screencast
  lifecycle for pipeline runs. Local runs (no `PLAYWRIGHT_RUN_ID`) skip recording.
- **`playwright.config.ts`**: Removed config-level `video` option — conflicts with
  fixture-managed screencast. Screencast is now entirely controlled by the fixture.
- **`tests/example/example.spec.ts`**: Import switched from `@playwright/test` to
  `@fixtures/base.fixture.js` to activate the screencast-enabled fixture.
- **`adapters/pi/capabilities.yaml`**:
  - `write-spec` template: added instruction to import from `@fixtures/base.fixture.js`.
  - `run-fix` template: updated video paths and added `ffmpeg` concatenation step.
- **`workflows/manifest.yaml`**: Updated `screencast-video` output description to
  reflect per-test `.webm` files.

### Fixed

- Root cause: config-level `video.show.actions` passed to `recordVideo` did not
  reliably produce visible action annotations in screencast frames. Switched to
  fixture-level `page.screencast.start()` + `showActions()` for direct control.
- Root cause: test spec imported from `@playwright/test` directly, bypassing the
  base fixture entirely. Fixed import and updated pipeline template for future runs.
