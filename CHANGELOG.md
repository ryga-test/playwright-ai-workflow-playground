# Changelog

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
