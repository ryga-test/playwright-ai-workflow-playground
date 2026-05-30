# PRD: Explicit Completion Signaling for Pipeline Runner Chaining

**Status:** Accepted  
**Date:** 2026-05-21  
**Related:** pipeline-runner-chaining-diagnosis.md, CONTEXT.md, DESIGN_DECISIONS.md, ADR-0018

## Problem Statement

The Pipeline Runner currently chains steps via `agent_end` events with module-level mutable state (`pendingPipelineStep`, `pendingGateApproval`). This produces "Agent is already processing" errors because `agent_end` fires before the pi runtime clears its internal processing flag, making `sendUserMessage` from within the handler racy. Repeated patches (idle guards, `streamingBehavior` options, 300ms yields) have not stabilized it.

## Solution

Each Pipeline step writes an explicit Completion Marker as the last line of its primary Artifact file. A CompletionWatcher module polls the known artifact path (500ms interval) and fires `onStepComplete(step, context)` when the marker is detected. The Runner consumes this event to advance the pipeline. The legacy `agent_end` handler, `pendingPipelineStep`, `pendingGateApproval`, the 300ms `setTimeout`, and the idle-guard are removed in the same change.

## Resolved Design Decisions

### Detection: filesystem polling, not agent_end parsing

The watcher polls the primary Artifact file at 500ms intervals. Watcher is only active when `watch()` has been called (i.e., a pipeline is running). Detection is decoupled entirely from runtime event timing — the marker proves the step is definitively complete.

### Marker format

Format-aware footer using each file type's comment convention, always the last line of the primary Artifact:

```
<!-- @step-complete step=3 runId=2026-05-21T... -->    (Markdown)
// @step-complete step=4 runId=2026-05-21T...          (TypeScript)
# @step-complete step=2 runId=2026-05-21T...           (YAML)
```

The watcher reads the last N bytes of the file and matches `/@step-complete step=(\d+) runId=(\S+)/`. Fields: `step` (cross-validation) and `runId` (fast matching). The marker is declared once in `workflows/manifest.yaml` as a pipeline-level `completion_marker` contract. `dispatchStep()` reads the format and appends a standardized instruction to every step prompt.

Runner also injects a self-check instruction: "Before completing, verify the file's last line contains the completion marker. If not, append it now."

### Dispatch: streamingBehavior "followUp" unconditionally

`dispatchStep()` always uses `{ streamingBehavior: "followUp" }`. The idle-guard and `isIdle()` check are removed. This is safe because the watcher fires long after the runtime has settled — unlike `agent_end` which fires mid-transition.

### Context: push model

The Runner constructs the full artifact path at dispatch time and passes it to `watcher.watch({ artifactPath, step, context })`. The watcher does not compute paths or understand the results directory structure.

### CompletionWatcher API

```typescript
interface CompletionWatcher {
  watch(req: WatchRequest): void;    // start polling (replaces any previous watch)
  unwatch(): void;                   // stop polling, idempotent
  destroy(): void;                   // tear down entirely, reject pending callbacks
  onComplete: (step: number, context: WatchContext) => void;
}

interface WatchRequest {
  artifactPath: string;
  step: number;
  context: WatchContext;
}
```

Single-watch invariant: `watch()` always calls `unwatch()` internally first. `destroy()` is called only by `/pipeline-reset`; it clears the interval and sets a destroyed flag that every pending poll checks before firing.

### State machine (onStepComplete callback)

```
onStepComplete(step, context):
  1. If step !== pipeline.currentStep: warn, return (stale watcher)
  2. If step === 1: runId verification from results dir, persist
  3. pipeline.stepMarkerReceived = true; persist
  4. nextStep = step + 1
  5. If nextStep > TOTAL_STEPS:
       pipeline.status = "complete"; persist; watcher.unwatch(); notify; return
  6. pipeline.currentStep = nextStep
  7. If GATED_STEPS.has(nextStep):
       pipeline.status = "paused_gate"; persist; watcher.unwatch(); notify; return
  8. // Non-gated auto-advance:
       pipeline.stepMarkerReceived = false; persist
       watcher.unwatch(); watcher.watch(nextStep artifact path)
       dispatchStep(nextStep)
```

### Gates and /pipeline-continue

`/pipeline-continue` sends `pi.sendUserMessage("approved", { streamingBehavior: "followUp" })` for artifact promotion as a side effect, then immediately advances: updates approval state, sets `currentStep = nextStep`, registers watcher for next step's artifact, dispatches if non-gated or pauses if gated. Does not wait for agent-side promotion to complete.

### Timeout

Runner-owned, not watcher-owned. Runner sets a timeout (90-120s) after dispatch. If it fires before `onStepComplete`, Runner calls `watcher.unwatch()` and notifies. The watcher itself polls until told to stop.

### Session restore

On `session_start`, if a pipeline is restored with status `"running"`:
- Check if the current step's primary artifact exists on disk.
- If yes: register watcher for that artifact. Watcher fires immediately if marker is already present, or waits if agent continues the turn.
- If no: reset pipeline entirely (artifact doesn't exist = unrecoverable).

If status is `"paused_gate"`: just notify, no watcher.

### /pipeline-status

`PipelineState` gains `stepMarkerReceived: boolean`. Shown per-step:
- `▶ 3/8 pipeline-extract-selectors [agent working]` — dispatched, no marker yet
- `✓ 3/8 pipeline-extract-selectors [marker received]` — completed via marker

### /pipeline-reset

Calls `watcher.destroy()` (hard kill — clears interval, sets destroyed flag, rejects pending callbacks), then clears pipeline state, then git cleanup.

## Deletion Surface

Removed from `.pi/extensions/pipeline-runner/index.ts`:
- `pendingPipelineStep` variable
- `pendingGateApproval` variable
- Entire `pi.on("agent_end", ...)` handler (~100 lines)
- 300ms `setTimeout` yield
- Idle-guard (`isIdle()` check in `dispatchStep`)
- `pendingPipelineStep`/`pendingGateApproval` clearing in `pipeline-reset`

Kept:
- `pipeline` state, `persistState()`, all four slash commands, `session_start` restore, all helpers

## Testing Strategy

**Runner tests** (inject `onStepComplete` directly — no filesystem):
- `onStepComplete(1, ctx)` with non-gated nextStep → assert `dispatchStep(2)` called
- `onStepComplete(3, ctx)` with gated nextStep=4 → assert status=paused_gate, no dispatch
- `onStepComplete(4, ctx)` with currentStep mismatch → assert warning, no state change
- `onStepComplete(8, ctx)` → assert status=complete, unwatch called
- `/pipeline-continue` from gate → assert approval state updated, next step dispatched
- `/pipeline-status` shows marker-received state
- `/pipeline-reset` calls `watcher.destroy()`, clears state

**Watcher tests** (temp directory with real file writes):
- Write file with valid marker → assert `onComplete` fired with correct step/context
- Write file without marker → assert `onComplete` never fires (timeout)
- Write file with wrong step in marker → assert `onComplete` not fired
- Write file after 3 poll cycles → assert `onComplete` fires on next poll
- `unwatch()` during polling → assert no callback after unwatch
- `destroy()` during polling → assert no callback after destroy

## Out of Scope

- PipelineOrchestrator state machine extraction
- Docker Runner changes
- Backfilling historical Run Artifacts
- New slash commands (beyond `/pipeline-status` enhancement)
- Approval Gate workflow changes (human still types "approved")
- Concurrent Run optimization
- Secondary "STEP_COMPLETE:N" in chat message (footer in Artifact is sufficient; chat visibility is a nice-to-have, not required for chaining)

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| LLM fails to emit marker | Prompt self-check instruction ("verify last line contains marker"); timeout + manual `/pipeline-retry`; provenance headers prove LLM follows structured-output instructions reliably |
| File written but marker missing | Timeout catches this — file exists but watcher never fires |
| Docker bind-mount latency | 500ms poll interval absorbs typical latency |
| Poll overhead when idle | Watcher only polls when `watch()` active; no pipeline = no polling |
| Reset during callback execution | `destroy()` sets flag; `onStepComplete` checks `pipeline === null` early-return |
| Restore with missing artifact | Reset pipeline — unrecoverable state |
