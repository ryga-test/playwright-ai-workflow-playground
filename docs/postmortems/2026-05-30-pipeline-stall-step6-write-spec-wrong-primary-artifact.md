# Pipeline Auto-Chaining Stall at Step 6 — Watched Primary Artifact Is a File the Step Never Creates (incident #2026-05-30-003)

### Date
2026-05-30 ~12:04–12:30 UTC (run `2026-05-30T120453Z`), investigated same day

### Authors
- @ryga (reporter)
- systematic-debugging session (investigator)

### Status
Resolved in source (fix applied to `.pi/extensions/pipeline-runner/index.ts`,
`workflows/manifest.yaml`, and `.pi/prompts/pipeline-write-spec.md`; new
`artifact-path.test.ts` 9/9, `marker-regex.test.ts` 11/11, `tsc --noEmit` clean).
**Runtime confirmation pending**: the extension does not hot-reload — verifying 6→7→8
auto-advance requires a pi-coding-agent session restart and a fresh pipeline run.

This is the **third instance of the same root-cause class** as incident #1 Bug #1
(`…-completion-marker-json.md`) and incident #2 / #5
(`…-step2-marker-wrong-file.md`): **the file the CompletionWatcher polls is not the file
the agent writes the marker into.** Incident #5's fix (name the exact watched file in the
dispatch instruction) was correct but incomplete — it assumed every step's declared
`primary_output` is a file that step actually produces. For step 6 (`write-spec`) it is not.

### Summary

On run `2026-05-30T120453Z` the pipeline advanced cleanly through steps 1–5 and both gates
(steps 4 and 5) — proving the incident-#1 and incident-#5 fixes work end-to-end. After the
step-5 gate was approved, step 6 (`pipeline-write-spec`, non-gated) executed, generated the
spec, and **stalled instead of auto-advancing to step 7**. The user observed: *"gated steps 4
and 5 stop one more time after I approve and the agent generates artifacts; steps 6, 7, 8 also
stop after finishing instead of auto-progressing."*

**Root cause (Bug #6):** `getPrimaryArtifactPath(6)` and `workflows/manifest.yaml` declared
write-spec's primary completion artifact as `results/.../flow-summary.md` — **a file write-spec
never creates.** `flow-summary.md` is a *step-7* output (and a step-8 input). write-spec's real
deliverable is the committed spec `tests/<app>/<flow-id>.spec.ts`. The agent correctly wrote the
`@step-complete step=6` marker into the file it actually produced (`…/step6-write-spec/public-home.spec.ts`),
the watcher polled `flow-summary.md` forever and never matched, and `onStepComplete(6)` never
fired. Because the runner advances *only* via the watcher and guards every transition with
`step !== currentStep`, the stall at `currentStep=6` made the entire tail (7, 8) manual.

The "gated steps 4 and 5 stop one more time" symptom is the same tail: gates 4 and 5 behaved
correctly (two gates by design = two approvals); the extra halt the user felt after approving
gate 5 was the step-6 stall. Step 8's missing `pipeline-summary.md` and its step-8 marker landing
in `flow-summary.md` are artifacts of the manual recovery, not an independent defect.

### Impact

| Dimension | Details |
|---|---|
| **Pipelines affected** | 1 run: `automation-in-testing/public-home/2026-05-30T120453Z` |
| **Where it stalled** | Step 6→7 transition (first run to reach step 6 with auto-chaining live, after the #1/#5 fixes) |
| **Duration impact** | Steps 6, 7, 8 required manual prompting instead of auto-chaining through the non-gated tail |
| **Artifact correctness** | All step content was produced correctly (3/3 tests passed); only orchestration broke |
| **User experience** | Pipeline halted after each approval/step; user had to detect and report the stall |
| **Data loss** | None |
| **Other flows/apps** | Defect is **general**: step 6 stalls on every flow/app, because the mismatch is in the static path map, not run-specific data |

### Root Cause

#### Bug #6 (Run 120453Z): watched primary artifact is not a file the step produces

1. **The watcher polls one hardcoded primary artifact per step.** For step 6,
   `getPrimaryArtifactPath(6)` returned `results/<app>/flows/<flow>/<run>/flow-summary.md`,
   matching `workflows/manifest.yaml` `write-spec.primary_output.path`.

2. **`flow-summary.md` is not a write-spec output.** Per `.pi/prompts/pipeline-write-spec.md`,
   step 6 produces `tests/<app>/<flow-id>.spec.ts` (and `.feature`, and a conditional `spec.diff`).
   `flow-summary.md` is declared in the manifest as a **step-7 (`run-fix`) output** and a **step-8
   (`summarize`) input**. write-spec has no reason to create it and didn't.

3. **The agent marked its real deliverable.** `grep '@step-complete' <run>` showed the step-6
   marker only in `…/step6-write-spec/public-home.spec.ts`; `flow-summary.md` contained a step-**8**
   marker and **no step-6 marker at all**. The watcher polled `flow-summary.md`, never matched, and
   `onStepComplete(6)` never fired.

4. **The incident-#5 fix could not save this case.** Since incident #5, `dispatchStep()` names the
   exact watched file in the instruction (single source of truth via `getPrimaryArtifactPath`). But
   the named file (`flow-summary.md`) is one write-spec does not create, so the instruction asked
   the agent to write a marker into a file outside its work. The agent followed its prompt (produce
   the spec) and marked the spec instead. Naming a *wrong* file is no better than naming no file.

5. **Step 6 is structurally unique.** It is the only step whose real primary deliverable is a
   **committed** file under `tests/` rather than a per-run file under
   `results/<app>/flows/<flow>/<run>/`. Steps 1–5, 7, 8 all signal completion via a per-run results
   file, so their watched path can equal a file they create. Step 6 had no per-run completion
   artifact, so the map fell back to an unrelated results file (`flow-summary.md`).

#### Causal chain (Bug #6)

```
Run 120453Z: steps 1–5 + gates 4,5 auto-chain correctly (incident #1/#5 fixes working)
gate 5 approved → /pipeline-continue dispatches step 6
dispatchStep(6) names flow-summary.md (from getPrimaryArtifactPath(6)) + registers watcher on it
    → Agent runs pipeline-write-spec, writes tests/.../public-home.spec.ts (12:21:53Z)
    → Agent puts // @step-complete step=6 in the spec it created, NOT in flow-summary.md
    → CompletionWatcher(step 6) polls flow-summary.md → no step=6 marker → onStepComplete(6) NEVER fires
    → currentStep stays 6; chain dead at step 6→7
    → Steps 7 (12:27:12Z) and 8 (12:28:29Z) driven manually; pipeline-summary.md never created
```

### Trigger

The incident-#1 and incident-#5 fixes let auto-chaining reach step 6 for the first time. The
latent path mismatch (dormant because the chain had never gotten this far) became the sole
remaining failure mode. Triggered by: `/pipeline-run automation-in-testing FLOW_ID=public-home`,
then `/pipeline-continue` at gates 4 and 5.

### Resolution

Chosen approach (per user decision): give step 6 a **per-run results file it creates**, keeping
it consistent with every other step and avoiding stale-marker hazards from committed files.

1. **`.pi/extensions/pipeline-runner/index.ts`** — `getPrimaryArtifactPath(6)` →
   `results/<app>/flows/<flow>/<run>/step6-write-spec/write-spec-report.md`. Exported the helper so
   it is unit-testable.

2. **`workflows/manifest.yaml`** — `write-spec.primary_output.path` →
   `…/step6-write-spec/write-spec-report.md`; added `write-spec-report` to the step's `outputs`.

3. **`.pi/prompts/pipeline-write-spec.md`** — new step 12 makes `write-spec-report.md` a mandatory
   deliverable (records spec path, source feature, test count, overwrite/diff status, typecheck
   result). This guarantees the watched file exists, so the auto-injected marker instruction lands
   in a file the agent reliably creates.

The watched file is `.md`, so `markerLineFor()` instructs `<!-- @step-complete step=6 runId=… -->`
as the final line. A per-run results path is also inherently stale-safe (scoped by runId in the
path), so no committed-file marker pollution and no need to add cross-step runId verification.

**Test coverage — new `.pi/extensions/pipeline-runner/artifact-path.test.ts`:**
Asserts each step's `getPrimaryArtifactPath` and explicitly guards that step 6 never points at
`flow-summary.md` again. Failed on step 6 before the fix, **9/9 after**. `marker-regex.test.ts`
still **11/11**; `tsc --noEmit` clean.

**Verification still required (runtime):**
- Restart the pi-coding-agent session (extension does not hot-reload — incident #1 AI #14).
- Re-run `/pipeline-run automation-in-testing FLOW_ID=public-home`, approve gates 4 and 5, and
  confirm 6→7→8 auto-advance without manual prompting and `pipeline-summary.md` is produced.

### Detection

- **How detected**: User observation — *"steps 6, 7, 8 stop after finishing instead of
  auto-progressing."* User invoked `/systematic-debugging` with run ID `2026-05-30T120453Z`.
- **Time to detect**: During/just after the run reached the back half.
- **What investigation found**: `grep '@step-complete'` across the run mapped every marker to its
  file; only step 6 (watched `flow-summary.md`) and step 8 (watched `pipeline-summary.md`, never
  created) mismatched. `flow-summary.md` confirmed to contain no step-6 marker. The prompt + manifest
  confirmed `flow-summary.md` is a step-7 output, not a write-spec output.
- **Alert mechanism**: None — a stalled watcher emits no warning (same gap as incidents #1/#5). The
  user remains the only detector.

### Action Items

| # | Action | Priority | Owner | Status |
|---|---|---|---|---|
| 1 | Give step 6 a per-run completion artifact (`write-spec-report.md`) and sync `index.ts` + manifest + prompt to it | P0 | @ryga | ✅ Done (working tree) |
| 2 | Add `artifact-path.test.ts` asserting every step's primary path + guarding step 6 ≠ flow-summary.md | P1 | @ryga | ✅ Done (9/9) |
| 3 | Commit the fix and verify at runtime after a session restart + fresh run | P0 | @ryga | ⬜ Pending |
| 4 | **Audit invariant test**: assert each step's `primary_output` is a file that step's prompt actually writes (the check that would have caught #1, #5, #6 at once). The map and the prompts are still maintained separately. | P0 | — | Backlog |
| 5 | **Watcher heartbeat/timeout warning** — if a step's watcher has not fired within N seconds of dispatch, emit a visible warning. Would have auto-detected #1, #2, #3, #5, #6. (Carried from incident #1 AI #5.) | P1 | — | Backlog |
| 6 | **End-to-end auto-chaining test** driving dispatch→watch→marker placement across all 8 steps with realistic artifact layouts. Every incident #1–#6 escaped because only the regex/path is unit-tested, not the loop. | P1 | — | Backlog |
| 7 | **Manifest as runtime source of truth.** `getPrimaryArtifactPath` is a hardcoded map that only happens to mirror the manifest ("manifest-driven later" per the code comment). Drive it from `workflows/manifest.yaml` so map and manifest cannot drift. | P2 | — | Backlog |
| 8 | **Decide a convention for committed primary deliverables.** Step 6's real output is committed (`tests/`). Either always route completion through a per-run results sidecar (done here) or add cross-step runId verification before ever watching a committed file. | P2 | — | Done-by-policy / Backlog |

### Lessons Learned

#### What went well
- The incident-#1 and incident-#5 fixes were genuinely correct: the chain reached step 6 for the
  first time and gates 4/5 worked — this was a new instance, not a regression.
- `grep '@step-complete'` across the run gave a dispositive, one-shot diagnosis: a table of
  marker-file vs watched-file made the single mismatch obvious.
- TDD caught the fix precisely: the new path test failed only on step 6 before and passed after,
  proving the change was scoped to the actual defect.

#### What went wrong
- **The class was fixed instance-by-instance, never structurally.** Bug #1 (JSON), Bug #5 (step-2
  sibling), Bug #6 (step-6 wrong file) are the same defect — watched file ≠ marker file — surfacing
  one step further each time the previous barrier was removed. This is the `systematic-debugging`
  Phase 4.5 signal: three instances of one defect in one subsystem is an under-tested invariant, not
  three unrelated bugs.
- **Incident #5's "this generalizes to all 8 steps" was wrong.** Naming the watched file only helps
  if the named file is one the step creates. No one verified that each declared `primary_output` is
  a real output of that step. Step 6's was not.
- **The map and the prompts are maintained independently.** `getPrimaryArtifactPath`, the manifest,
  and the step prompts each declare "what step 6 produces" separately; they drifted. Nothing tests
  that they agree (AI #4/#7).
- **Coverage tested the regex and now the path, but still not the loop.** The dispatch → agent file
  choice → watch cycle remains untested end-to-end (AI #6).

#### Where we got lucky
- Step 6's deliverable is `.ts`/`.md`-adjacent and the fix needed only a per-run sidecar; no format
  that genuinely cannot host a marker was involved.
- The run still produced correct content and passing tests, so the only cost was manual babysitting,
  not a bad artifact shipped.

### Timeline

| Time (UTC) | Event |
|---|---|
| 12:04:53 | **Run 120453Z** invoked: `/pipeline-run automation-in-testing FLOW_ID=public-home` |
| 12:04–12:19 | Steps 1–5 auto-chain; gates 4 and 5 reached and approved (`/pipeline-continue`) — incident #1/#5 fixes working |
| 12:11:00 | Test-draft-review gate approval stamped into spec provenance (`approvedAt=2026-05-30T12:11:00Z`) |
| 12:19:12 | Step 5 writes `test-drafts-index.md` with step=5 marker (watched file) ✓ |
| 12:21:53 | Step 6 writes the spec with `// @step-complete step=6` in `…/step6-write-spec/public-home.spec.ts` — **not** in the watched `flow-summary.md` |
| 12:21:53+ | Watcher(step 6) polls `flow-summary.md`; no step=6 marker → `onStepComplete(6)` never fires → chain dead at 6→7 — **Bug #6** |
| 12:27:12 | Step 7 `test-report.md` written (step=7 marker) — driven manually |
| 12:28:29 | Step 8 writes `flow-summary.md` with step=8 marker; `pipeline-summary.md` never created — manual |
| (later) | User reports stall with run ID `2026-05-30T120453Z`, invokes `/systematic-debugging` |
| (later) | Investigation: marker/file table shows only steps 6 and 8 mismatched; root cause = step-6 watched path is a non-produced file |
| (later) | Fix applied (per-run `write-spec-report.md`) across `index.ts` + manifest + prompt; `artifact-path.test.ts` added (9/9); `marker-regex` 11/11; `tsc` clean |

### Supporting Information

- **Affected run**: `results/automation-in-testing/flows/public-home/2026-05-30T120453Z/`
- **Pipeline branch**: `pipeline/automation-in-testing/public-home/2026-05-30T120453Z`
- **Extension file**: `.pi/extensions/pipeline-runner/index.ts`
  - Bug #6 location: `getPrimaryArtifactPath()` step-6 entry returned `flow-summary.md`
  - Fix: step-6 entry → `…/step6-write-spec/write-spec-report.md`; helper exported for testing
- **Prompt**: `.pi/prompts/pipeline-write-spec.md` — produces `tests/<app>/<flow-id>.spec.ts`; new step 12 writes `write-spec-report.md`
- **Manifest**: `workflows/manifest.yaml` — `write-spec.primary_output` corrected; `write-spec-report` added to outputs; `flow-summary.md` confirmed a step-7 output / step-8 input
- **Test files**: `.pi/extensions/pipeline-runner/artifact-path.test.ts` (new, 9 cases), `marker-regex.test.ts` (11 cases, unchanged)
- **Watcher regex**: `@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)` (unchanged since incident #1)
- **Prior incidents**: `2026-05-30-pipeline-chaining-failure-completion-marker-json.md` (Bug #1), `2026-05-30-pipeline-stall-step2-marker-wrong-file.md` (Bug #5) — Bug #6 is the same class
