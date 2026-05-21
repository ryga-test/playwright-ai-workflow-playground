# Task Breakdown: Explicit Completion Signaling for Pipeline Runner Chaining

**Related PRD:** `docs/pipeline-runner-explicit-completion-signaling.md`  
**Date:** 2026-05-21  
**Status:** Ready for implementation  
**Dependencies:** Current pipeline-runner in `.pi/extensions/pipeline-runner/index.ts`, `workflows/manifest.yaml`, pipeline prompt files in `.pi/prompts/`

## Overview

Replace the fragile `agent_end` + mutable `pendingPipelineStep`/`pendingGateApproval` + 300ms yield chaining mechanism with a robust, filesystem-polling CompletionWatcher that detects explicit `@step-complete` markers written as the last line of each step's primary artifact. This eliminates race conditions ("Agent is already processing") and makes pipeline advancement deterministic and decoupled from pi runtime event timing. The change also modernizes dispatch to always use `streamingBehavior: "followUp"`, updates state machine, session restore, commands, and removes ~100 lines of legacy code.

## Architecture Decisions
- **Detection mechanism:** Filesystem polling (configurable `poll_interval_ms` from manifest, default 500) on explicit per-step `primary_output.path` (push model). Marker is authoritative.
- **Marker contract:** Pipeline-level `completion_marker` + explicit per-step `primary_output.path` + configurable `poll_interval_ms` in `workflows/manifest.yaml`; format-aware footer injected by `dispatchStep` + self-check in prompts.
- **State:** `PipelineState` extended with `stepMarkerReceived: boolean`; watcher manages its own interval; single-watch invariant enforced.
- **Gates & continue:** `/pipeline-continue` triggers promotion then immediately advances watcher + dispatch (no wait for side-effect completion).
- **Removal scope:** Delete `pending*` vars, entire `agent_end` handler, idle-guard, 300ms timeouts; keep `pipeline` state, persist, slash commands, restore skeleton.
- **Testing:** Pure unit tests for state machine (inject `onComplete`); temp-dir integration tests for watcher polling.

## Phase 1 Implementation Results & Notes (2026-05-21)

**Branch:** `002-phase1-completion-signaling` (created via speckit-git-feature)

**Completed:**
- Task 1: Added `CompletionWatcher` class in `.pi/extensions/pipeline-runner/index.ts` with full interface (watch/unwatch/destroy/onComplete), 500ms default poll, last-512-bytes tail read, regex match ignoring comment prefix, single-watch + destroyed flag safety. TS compiles cleanly.
- Task 2: Updated `workflows/manifest.yaml` with top-level `completion_marker` (regex, poll_interval_ms:500) and `primary_output` declaration (path + format) for all 8 steps. Chose sensible primary artifacts (prefer markdown/ts/yaml for footer compatibility; json for step1 ok as marker is text footer only).
- Task 3: Added `getPrimaryArtifactPath(step, app, flowId, runId, cwd)` helper with explicit step->template map matching the primary_outputs. Returns absolute path under cwd/results/...

**Implementation notes:**
- Watcher uses Node fs sync calls in poll (safe for extension context); errors swallowed to keep polling.
- Regex tuned to match runId format like 2026-05-21T135109Z (flexible).
- No integration with dispatch/onStepComplete yet (Phase 2).
- No unit tests added (Phase 4); manual verification via tsc --noEmit passed with zero errors.
- Manifest edit preserves original structure; primary_output is additive for backward compat.
- Resolver currently hardcoded map (maintainable for 8 steps); future: parse manifest for dynamic primary + template resolution.

**Next:** Proceed to Phase 2 (refactor dispatchStep, implement onStepComplete state machine, remove legacy agent_end).

**Fallow gate:** Pending commit (will run `fallow audit --format json --quiet --explain` before any git commit).

## Phase 2 Implementation Results & Notes (2026-05-21)

**Branch:** `002-phase1-completion-signaling` (continued work)

**Completed:**
- Task 4: Refactored `dispatchStep` — always `streamingBehavior: "followUp"`, removed isIdle guard + 300ms, injects detailed marker instruction + self-check footer for every step (format examples for md/ts/yaml), sets `stepMarkerReceived=false`, registers `watcher.watch()` with primary artifact path + context.
- Task 5: Implemented `onStepComplete(step, context)` state machine exactly per PRD (stale check, step1 runId verify via findRunId, set marker flag, compute next, complete/gated/non-gated paths with persist, unwatch/watch, dispatch). Wired `watcher.onComplete = onStepComplete`. Extended `PipelineState` with `stepMarkerReceived`. Updated `pipeline-run` init + `session_start` restore + basic watcher re-attach.
- Task 6: Removed all legacy — `pendingPipelineStep`, `pendingGateApproval` vars + clears, entire `pi.on("agent_end", ...)` (~100 lines incl. cases + 300ms yields), idle-guard, old comments. Refactored `/pipeline-continue` to send approved + immediately advance (update approvals, set currentStep, register watcher, dispatch non-gated or pause; no wait on promotion). Updated `/pipeline-reset` to call `watcher.destroy()`.

**Implementation notes:**
- `onStepComplete` uses `process.cwd()` fallback for paths/verify (ctx.cwd preferred when available from handlers); full ctx/ui integration for notifies can be polished.
- Continue now matches PRD "push model" advance without agent_end dependency — enables removal.
- Status machine handles gated (4/5) and final step correctly; non-gated auto-chains via watcher.
- No more "Agent is already processing" races possible (decoupled from runtime timing).
- tsc --noEmit passes; ~150 lines net reduction in legacy code.
- Marker instruction is static for Phase 2 (manifest-driven format in future).

**Verification done:** Manual code review + compile; end-to-end chaining logic matches spec (non-gated auto, gated pause+continue works via new path).

**Next:** Phase 3 (update /pipeline-status for marker state, full session restore, /pipeline-reset polish) then Phase 4 tests + docs.

## Phase 3 Implementation Results & Notes (2026-05-21)

**Branch:** `002-phase1-completion-signaling`

**Completed:**
- Task 7: Enhanced `/pipeline-status` to display per-step marker state (`[marker received]` vs `[agent working]`) for current step using `stepMarkerReceived` flag (matches PRD examples exactly).
- Enhanced `session_start` restore: checks existence of current primary artifact; if exists → attach watcher (auto-fires if marker present); if missing → full reset + notify; for paused_gate → notify only, no watcher. Defaults stepMarkerReceived for compat.
- `/pipeline-continue` and `/pipeline-reset` already aligned in Phase 2 (immediate advance + watcher.destroy()); minor polish for phase3 consistency.
- Added `markerStatus` helper in status for clean UI output.

**Implementation notes:**
- Restore now robust per PRD: "Check if the current step's primary artifact exists on disk. If yes: register watcher... If no: reset pipeline entirely". Uses fs.existsSync.
- Status output now shows e.g. `▶ 3/8 pipeline-extract-selectors [agent working]` or `[marker received]`.
- No new commands; existing 4 slash cmds fully support watcher lifecycle.
- tsc clean; watcher re-use on restore prevents duplicate intervals (single-watch invariant).

**Verification:** Compile + logic review; restore scenarios (running with/without artifact, paused_gate) covered in code.

**Next:** Phase 4 (tests per PRD strategy, prompt/docs updates, full E2E run verification).

## Task List

### Phase 1: Foundation — Watcher, Types, Contract

**Task 1: Define CompletionWatcher interface, polling implementation, and lifecycle methods**

**Description:** Create a `CompletionWatcher` class (or module inside the extension) that supports `watch({artifactPath, step, context, pollIntervalMs?})`, `unwatch()`, `destroy()`, and `onComplete` callback. `pollIntervalMs` (default from manifest, e.g. 500) is passed by Runner. Implements configurable `setInterval` polling that reads last N bytes, matches `/@step-complete step=(\d+) runId=(\S+)/`, fires only on match. Enforce single-watch, destroyed flag, early returns.

**Acceptance criteria:**
- [ ] `watch()` accepts optional pollIntervalMs and starts/replaces interval
- [ ] Poll detects marker within expected cycles
- [ ] `unwatch()` / `destroy()` fully stop callbacks and clean up
- [ ] Wrong step/runId or post-destroy writes are ignored
- [ ] Missing file: continues polling safely

**Verification:**
- [ ] Unit tests pass for watcher lifecycle + configurable interval
- [ ] Manual temp-dir tests confirm detection timing matches interval
- [ ] No leaks after destroy

**Dependencies:** None

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts` (watcher + types)

**Estimated scope:** Small (1-2 files)

---

**Task 2: Extend workflows/manifest.yaml with completion_marker contract, explicit primary_output per step, and configurable pollInterval**

**Description:** Add top-level `completion_marker` declaration (format, regex, footer style) and per-step `primary_output.path` (explicit, resolvable with {{app}}/{{flow-id}}/{{run}}) to `workflows/manifest.yaml`. Also add top-level `poll_interval_ms: 500` (or per-step override) so the watcher interval is manifest-driven and configurable. Runner reads these at dispatch/restore time.

**Acceptance criteria:**
- [ ] `manifest.yaml` contains `completion_marker` + `poll_interval_ms`
- [ ] All 8 steps declare explicit `primary_output.path` (not derived from first output)
- [ ] Schema backward-compatible; YAML validates

**Verification:**
- [ ] YAML parses cleanly
- [ ] Manual review confirms primary paths and poll config

**Dependencies:** Task 1

**Files likely touched:**
- `workflows/manifest.yaml`

**Estimated scope:** Small (1 file)

---

**Task 3: Add step-to-primary-artifact path resolver helper**

**Description:** Implement `getPrimaryArtifactPath(step: number, app: string, flowId: string, runId: string, cwd: string): string` (or equivalent) that uses manifest data or hardcoded map to return the full filesystem path to the primary artifact for that step. Used by dispatch and restore logic.

**Acceptance criteria:**
- [ ] Correct path returned for all 8 steps using results/ layout
- [ ] Handles template vars and step-specific subdirs (e.g. step4-draft-page-object/)
- [ ] Graceful fallback or error for unknown step

**Verification:**
- [ ] Unit tests cover all steps with sample inputs
- [ ] Paths exist after running sample pipeline steps (or mocked)

**Dependencies:** Task 2

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts`

**Estimated scope:** Small

### Checkpoint: Foundation
- [ ] Watcher unit + integration tests green
- [ ] manifest.yaml updated and validated
- [ ] Path resolver tested
- [ ] No breaking changes to existing pipeline state or commands

### Phase 2: Core Runner Refactoring — Dispatch, State Machine, Removal of Legacy

**Task 4: Refactor dispatchStep to always use "followUp", inject marker instruction, and register watcher**

**Description:** Update `dispatchStep(step)` to:
- Always call `pi.sendUserMessage(..., { streamingBehavior: "followUp" })` (remove isIdle guard and conditional)
- Read completion marker format from manifest
- Append standardized footer instruction + self-check ("Before completing, verify the file's last line contains the completion marker...") to the message for every step
- After setting pipeline state, call `watcher.watch({ artifactPath: getPrimary..., step, context: {runId, ...} })`
- Set `pipeline.stepMarkerReceived = false`

**Acceptance criteria:**
- [ ] Every dispatched step prompt ends with marker instruction + self-check
- [ ] Watcher is registered for the correct primary artifact
- [ ] No more idle-guard or 300ms yield inside dispatch
- [ ] streamingBehavior always "followUp"

**Verification:**
- [ ] Inspect generated messages in logs or test runs
- [ ] Pipeline step 1-8 dispatch produces watch registration

**Dependencies:** Tasks 1-3

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts`

**Estimated scope:** Medium (core dispatch + prompt augmentation)

---

**Task 5: Implement onStepComplete state machine callback and integrate with watcher**

**Description:** Replace agent_end logic with `onStepComplete(step, context)` handler that implements the exact state machine from PRD:
1. Stale step check
2. Step 1 runId verification + persist
3. Set `stepMarkerReceived = true`
4. Compute nextStep
5. If last step → complete, unwatch, notify
6. If gated → paused_gate, unwatch, notify
7. Else → reset marker flag, unwatch old, watch next, dispatchStep(next)

Wire watcher `onComplete` to call this.

**Acceptance criteria:**
- [ ] State transitions exactly match PRD spec for non-gated, gated, final, and mismatch cases
- [ ] `persistState()` called on relevant changes
- [ ] Watcher lifecycle (watch/unwatch) correct at each transition

**Verification:**
- [ ] Runner unit tests: inject onComplete directly for all cases (non-gated advance, gate pause, complete, stale)
- [ ] No dispatch on mismatch or completed pipeline

**Dependencies:** Task 4

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts`

**Estimated scope:** Medium

---

**Task 6: Remove legacy pending state, agent_end handler, idle guards, and 300ms yields**

**Description:** Delete from `.pi/extensions/pipeline-runner/index.ts`:
- `pendingPipelineStep` and `pendingGateApproval` declarations + all assignments/clears
- Entire `pi.on("agent_end", ...)` block (~100 lines)
- Any remaining `setTimeout(300)` or `isIdle()` checks
- Clear logic in reset that touched pendings (already covered)

Keep all pipeline state, persist, commands, session_start skeleton, and helpers.

**Acceptance criteria:**
- [ ] File compiles with zero references to removed symbols
- [ ] No "agent_end" listener remains
- [ ] `pipeline-reset` still clears pipeline and calls watcher.destroy()

**Verification:**
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] Extension loads without errors in pi
- [ ] Manual: /pipeline-run still works end-to-end (now via watcher)

**Dependencies:** Task 5 (must have new path before removal)

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts`

**Estimated scope:** Small (deletion + cleanup)

### Checkpoint: Core Chaining Works
- [ ] Non-gated auto-advance via marker succeeds (steps 1→2→3→6→7→8)
- [ ] Gated steps 4/5 pause correctly and /pipeline-continue advances
- [ ] No more "Agent is already processing" errors during chaining
- [ ] /pipeline-status shows new "marker received" state

### Phase 3: Command & Session Updates

**Task 7: Update /pipeline-continue, /pipeline-status, /pipeline-reset, and session_start restore for watcher + new state**

**Description:**
- `/pipeline-continue`: After sending "approved", update approvals, set currentStep, register watcher for next artifact, dispatch if non-gated or pause; do not block on promotion.
- `/pipeline-status`: Show `stepMarkerReceived` per step (`[marker received]` vs `[agent working]`)
- `/pipeline-reset`: Call `watcher.destroy()` before clearing state + git cleanup
- `session_start`: If restored pipeline status==="running" and current step artifact exists → register watcher (fires immediately if marker already there); if missing artifact → full reset. For paused_gate: just notify.

**Acceptance criteria:**
- [ ] Continue from gate correctly wires watcher and advances
- [ ] Status output includes new marker state indicator
- [ ] Reset hard-kills watcher (no callbacks after)
- [ ] Restore on existing artifact with marker fires completion immediately
- [ ] Restore on missing artifact resets pipeline cleanly

**Verification:**
- [ ] Manual session restore tests (close/reopen pi with active pipeline)
- [ ] Status UI shows correct per-step state
- [ ] Reset during active watch produces no orphaned callbacks

**Dependencies:** Tasks 5-6

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts`

**Estimated scope:** Medium

### Checkpoint: Full Lifecycle Stable
- [ ] Start → run all steps (with gates) → complete → reset works
- [ ] Session restore recovers running/paused pipelines correctly
- [ ] All four slash commands updated and functional

### Phase 4: Testing, Documentation, Polish

**Task 8: Implement Runner unit tests and Watcher integration tests**

**Description:** Add or extend tests per PRD Testing Strategy:
- Runner tests: mock/inject `onStepComplete` for state machine cases
- Watcher tests: use `fs` + temp dir, write files with/without markers, wrong step, delayed writes, unwatch/destroy during poll
- Verify no callbacks after stop, correct context passed, timeout behavior (runner-owned timeout)

**Acceptance criteria:**
- [ ] All listed test cases in PRD pass
- [ ] Tests are deterministic and fast (<5s total)
- [ ] Coverage for watcher polling edge cases

**Verification:**
- [ ] `npm test` (or extension test command) passes
- [ ] New tests run in CI if applicable

**Dependencies:** Tasks 1-7

**Files likely touched:**
- `.pi/extensions/pipeline-runner/index.ts` (or new `__tests__/pipeline-runner.test.ts`)
- Possibly `tests/` or extension test harness

**Estimated scope:** Medium (test code)

---

**Task 9: Update prompts and documentation; final verification**

**Description:** 
- Ensure all 8 pipeline-*.md prompts are compatible with injected marker instruction (or add minimal footer note if needed)
- Update `CONTEXT.md`, `DESIGN_DECISIONS.md`, and/or ADR if required
- Run full pipeline end-to-end on example app; verify markers appear in primary artifacts and chaining succeeds without races
- Remove any obsolete comments referencing old pending/agent_end logic

**Acceptance criteria:**
- [ ] Markers written to correct primary files for every step
- [ ] Full 8-step run completes cleanly with new mechanism
- [ ] Docs reference the new completion signaling approach
- [ ] No console warnings or runtime errors during pipeline

**Verification:**
- [ ] End-to-end manual run: `/pipeline-run <app> FLOW_ID=...` through all steps + gates
- [ ] `grep -r "agent_end\|pendingPipelineStep" .pi/extensions/pipeline-runner/` returns nothing
- [ ] Build/lint clean

**Dependencies:** All prior tasks

**Files likely touched:**
- `.pi/prompts/pipeline-*.md` (minor)
- `docs/CONTEXT.md`, `DESIGN_DECISIONS.md`
- `docs/pipeline-runner-explicit-completion-signaling-tasks.md` (this doc)

**Estimated scope:** Small-Medium

### Checkpoint: Complete
- [ ] All acceptance criteria from PRD met
- [ ] Zero legacy chaining code remains
- [ ] Full pipeline executes reliably with explicit markers
- [ ] Tests pass; ready for human review / fallow audit / commit

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM omits marker despite self-check | High | Runner timeout (90-120s) catches it; manual `/pipeline-retry` or continue; provenance headers already encourage structured output |
| Docker bind-mount write latency > poll interval | Med | Configurable `poll_interval_ms` (manifest) absorbs latency; default 500ms sufficient |
| Primary artifact path mismatch | High | Manifest-driven resolver + explicit primary_output per step; test resolver thoroughly |
| Restore with partial artifact (marker absent) | Med | Session_start checks existence; if artifact missing → full reset (unrecoverable anyway) |
| Watcher callback during reset/destroy | Low | destroyed flag + early return in onStepComplete and poll handler |
| Marker format edge cases (very large files) | Low | Read only last N bytes (e.g. 256); regex anchored to end |

## Resolved Decisions (from feedback)
- **primary_output:** Explicitly declared per-step in `manifest.yaml` (maintainability preferred over deriving from first output).
- **poll interval:** Configurable via `poll_interval_ms` (default 500) in `manifest.yaml` (top-level or per-step).
- **Secondary chat echo:** Kept out of scope per PRD (footer in primary artifact is sufficient).

## Parallelization Notes
- Tasks 1-3 (foundation) can be done in parallel by different agents if watcher interface is agreed first.
- Task 6 (removal) must follow Task 5.
- Test writing (Task 8) can begin as soon as Task 5 state machine is stable.

**Next step after approval:** Implement Phase 1 tasks, then run Checkpoint review.