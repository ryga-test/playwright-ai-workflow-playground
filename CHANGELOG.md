# Changelog

## 2026-05-01 — Git Worktree Isolation per Pipeline Run

### Added

- **Per-run git worktree isolation**: `/pipeline-run <app>` now creates a dedicated
  git branch (`pipeline/<app>/<runId>`) and an isolated worktree at
  `worktrees/<app>/<runId>/`. Each pipeline run operates in a fully isolated
  working directory, preventing cross-run interference.
- **Automatic worktree setup**: `.env` and `.env.example` are copied into the
  worktree, and `node_modules` is symlinked (avoids reinstall).
- **Worktree cleanup on reset**: `/pipeline-reset` removes the worktree
  (`git worktree remove --force`) and force-deletes the pipeline branch.
- **`worktrees/` added to `.gitignore`**.

### Changed

- **`/pipeline-run` now pre-generates the run ID** before dispatching step 1.
  The runId is passed directly to the agent as a second argument — the agent
  no longer generates its own timestamp.
- **Step 1 (`/pipeline-resolve <app> <runId>`)** updated to accept the
  pre-generated runId instead of generating one.
- **Every dispatched step includes a `WORKTREE CONTEXT` header** telling the
  agent to read/write/run commands relative to the isolated worktree directory.
  Bash commands are prefixed with `cd <worktree>` instructions.
- **`PipelineState`** now includes a `worktree` field persisted across session
  restarts.
- **`/pipeline-status`** now displays the worktree path.
- **Completion notification** shows the worktree path and branch name for
  review and merge.

### Updated files

| File | Change |
|------|--------|
| `.pi/extensions/pipeline-runner/index.ts` | Major rewrite: worktree creation, cleanup, context injection |
| `.pi/prompts/pipeline-resolve.md` | Argument hint changed to `<app> <runId>` |
| `adapters/pi/capabilities.yaml` | Resolve step: pre-generated runId, worktree docs |
| `contracts/adapter.schema.yaml` | Resolve step signature updated |
| `specs/001-ai-e2e-framework/contracts/adapter.schema.yaml` | Resolve step signature updated |
| `.gitignore` | Added `worktrees/` |

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
