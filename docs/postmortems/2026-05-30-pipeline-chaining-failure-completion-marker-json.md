# Pipeline Auto-Chaining Failure — Step 1 Completion Marker Not Detected (incident #2026-05-30-001)

### Date
2026-05-30 06:53–07:00 UTC

### Authors
- @ryga (reporter, investigator)

### Status
Resolved. Fix deployed in `.pi/extensions/pipeline-runner/index.ts` line 406. Test coverage added.

### Summary

The pipeline-runner extension's CompletionWatcher never detected the step-1 completion marker
for run `2026-05-30T065319Z` (automation-in-testing / public-home). As a result, every pipeline
step (1 through 8) required manual human intervention instead of auto-chaining through the
non-gated steps (1–3, 6–8). The pipeline itself completed successfully (8/8 tests passed), but
the **auto-chaining mechanism was fully broken** for the entire run.

The root cause was a format mismatch: step 1's primary artifact is JSON (`run-metadata.json`),
which cannot host inline comments. The agent correctly avoided corrupting the JSON and wrote
the marker to a separate `completion.md` file, but the CompletionWatcher was polling only the
JSON file and never saw it.

**Prior runs on `main` were not affected** because they used the older `agent_end` event-driven
chaining path, which has its own fragility but happened to work for those step shapes.

### Impact

| Dimension | Details |
|---|---|
| **Pipelines affected** | 1 run: `automation-in-testing/public-home/2026-05-30T065319Z` |
| **Duration impact** | Pipeline required manual `/pipeline-continue` or equivalent prompting at every step instead of auto-chaining through non-gated steps |
| **Artifact correctness** | All 8 artifacts generated correctly; all 8 tests passed |
| **User experience** | Agent needed explicit prompting to proceed after each step — user had to babysit the pipeline |
| **Data loss** | None |
| **Other flows/apps** | None affected — issue is latent in the completion marker instruction, triggered only for step 1 JSON artifacts |

### Root Causes

1. **The completion marker format instruction in `dispatchStep()` (`index.ts` line 406) covered only comment-based formats** (Markdown, TypeScript, YAML) but not JSON. Step 1's primary artifact is JSON (`run-metadata.json`), which cannot host inline comments without breaking the file.

2. **The agent correctly identified the format constraint** — it wrote the marker to a separate `completion.md` file to avoid corrupting the JSON. This was the rational behavior: when told "append the marker as the final line" and the file is JSON, a separate file is the only non-destructive option.

3. **The CompletionWatcher polls only the declared primary artifact path** (`getPrimaryArtifactPath` uses a hardcoded template map keyed to `run-metadata.json`). There is no fallback or companion-file scanning.

4. **No test coverage existed** for the completion marker regex across all artifact formats. JSON was never validated.

#### Causal chain

```
dispatchStep(1) sends marker instruction listing only comment formats
    → Agent writes marker to completion.md (can't put comment in JSON)
    → CompletionWatcher polls step1-resolve/run-metadata.json
        → Last 512 bytes of run-metadata.json: "...\n}" (no marker)
    → onStepComplete(1) never fires
    → Watcher for step 2 never registered
    → Entire auto-chaining chain dead from step 1 onward
```

### Trigger

Normal pipeline invocation: `/pipeline-run automation-in-testing FLOW_ID=public-home`. The latent bug was present in the Phase 2 completion-signaling implementation (commit `2af563a` and related). It was triggered the first time a step-1 JSON artifact needed the marker under the new code path.

### Resolution

**Single fix to `.pi/extensions/pipeline-runner/index.ts`** (line 406):

Added a JSON entry to the completion marker instruction block:

```
"_stepComplete": "@step-complete step=${step} runId=${runId}"  (JSON — last key before closing })
```

With guidance: *"For JSON, add it as the final top-level key."*

**No regex change needed.** The existing watcher regex scans raw text in the last 512 bytes of the file using substring matching (not JSON parsing). The string `"@step-complete step=1 runId=..."` inside a JSON string value is detected by the same regex as comment-style markers.

**Test coverage added** in `.pi/extensions/pipeline-runner/marker-regex.test.ts`: 9 test cases covering JSON (`_stepComplete` key), Markdown, YAML, TypeScript, Gherkin formats, plus negative tests (missing marker, wrong step). All pass.

### Detection

- **How detected**: User observation — the agent was asking for continuation at steps that should have been automatic
- **Time to detect**: Approximately 5 minutes into the run (step 1 → step 2 transition failed to auto-advance)
- **Alert mechanism**: None (auto-chaining failure has no programmatic alert; the user is the detector)

## Action Items

| # | Action | Priority | Owner | Status |
|---|---|---|---|---|
| 1 | Add JSON format to completion marker instruction in `dispatchStep()` | P0 | @ryga | ✅ Done |
| 2 | Add marker-regex test covering all artifact formats | P1 | @ryga | ✅ Done |
| 3 | Consider adding a watcher integrity check: if step 1 watcher hasn't fired within N seconds of dispatch, emit a warning | P2 | — | Backlog |
| 4 | Audit all 8 `getPrimaryArtifactPath` entries: confirm each primary artifact format matches its instruction entry | P2 | — | Done (only step 1 is JSON) |
| 5 | Add pipeline health metric: `steps_auto_advanced` vs `steps_manual_prompted` per run | P3 | — | Backlog |
| 6 | Consider a format-agnostic marker sidecar convention (e.g., `<artifact>.step-complete`) as defense-in-depth for formats that cannot host markers inline | P3 | — | Backlog |

## Lessons Learned

### What went well
- The agent exhibited rational behavior: when a format constraint blocks the instruction, it finds a non-destructive alternative (separate `completion.md`)
- The bug was isolated to a single instruction string; no structural redesign needed
- The watcher regex was robust enough to handle JSON-embedded markers with zero modification
- All pipeline artifacts were produced correctly — only the orchestration was broken, not the content

### What went wrong
- **Format-blind instruction design**: The completion marker instruction assumed all primary artifacts are comment-friendly formats. JSON was an unhandled variant.
- **No format-to-instruction validation**: There's no mapping or check that the declared primary artifact format has a matching entry in the marker instruction template.
- **Single-point-of-failure chaining**: One marker miss kills the entire chain. There's no heartbeat, timeout, or secondary detection mechanism.

### Where we got lucky
- Step 1 is the *only* JSON primary artifact. If other steps used JSON, the chain would have broken again later.
- The watcher regex works on raw text, not parsed JSON. No regex change or parser integration was required.
- The agent created `completion.md` rather than silently omitting the marker or corrupting the JSON — making the failure mode easy to diagnose.

## Timeline

| Time (UTC) | Event |
|---|---|
| 06:53:19 | Pipeline invoked: `/pipeline-run automation-in-testing FLOW_ID=public-home` |
| 06:53 | Step 1 dispatched with run ID `2026-05-30T065319Z` |
| 06:54 | Agent completes step 1, writes marker to `completion.md` (not `run-metadata.json`) |
| 06:54+ | Watcher polls `run-metadata.json` — no marker found. `onStepComplete` never fires |
| 06:54–06:57 | Steps 1–6 all require manual prompting to advance (chain is dead) |
| 06:57 | Step 6: spec written, flow-summary.md generated |
| 06:58 | Step 7: 8/8 tests pass (Playwright executed manually by agent) |
| 06:59 | Step 8: pipeline summary generated |
| 06:59 | Pipeline completes — user reports "agent step at each step instead of just gated step" |
| 07:00–07:05 | Phase 1 investigation: markers checked across all 8 artifacts, root cause identified |
| 07:05–07:10 | Fix implemented: JSON format added to marker instruction |
| 07:10 | Test suite (9 cases, all formats) written and passing |

## Supporting Information

- **Affected run**: `results/automation-in-testing/flows/public-home/2026-05-30T065319Z/`
- **Pipeline branch**: `pipeline/automation-in-testing/public-home/2026-05-30T065319Z`
- **Extension file**: `.pi/extensions/pipeline-runner/index.ts` (line 406)
- **Test file**: `.pi/extensions/pipeline-runner/marker-regex.test.ts`
- **Watcher regex**: `@step-complete step=${step} runId=([\w-]+T[\w:]+Z?)` (unchanged)
- **Completion marker contract**: `workflows/manifest.yaml` → `completion_marker.regex`
- **Related ADR**: `docs/adr/0018-completion-marker-over-agent-end-chaining.md`
- **Prior diagnosis**: `docs/pipeline-runner-chaining/pipeline-runner-chaining-diagnosis.md`
- **Design decisions**: `docs/pipeline-runner-chaining/pipeline-runner-explicit-completion-signaling.md`
