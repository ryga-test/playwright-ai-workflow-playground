# Pipeline Auto-Chaining Stall at Step 2 — Marker Written to Wrong File (incident #2026-05-30-002)

### Date
2026-05-30 08:45–09:?? UTC (run `2026-05-30T084514Z`)

### Authors
- @ryga (reporter)
- systematic-debugging session (investigator)

### Status
Resolved in source (fix applied to `.pi/extensions/pipeline-runner/index.ts`, marker-regex
tests 11/11, `tsc --noEmit` clean). **Runtime confirmation pending**: requires a pi-coding-agent
session restart (extension does not hot-reload) and a fresh pipeline run to verify step 2→3
auto-advances. Commit pending.

This is a **follow-on to incident #2026-05-30-001**
(`2026-05-30-pipeline-chaining-failure-completion-marker-json.md`). That incident's four bugs
(#1 JSON instruction gap, #2 regex escaping, #3 documented-but-not-applied, #4 `deliverAs`
option name) were all resolved. With auto-chaining finally working end-to-end past step 1 for
the first time, a **fifth** defect surfaced one step later — and it is the **same root-cause
class as Bug #1**: the file the CompletionWatcher polls is not the file the agent writes the
marker into.

### Summary

On run `2026-05-30T084514Z` the pipeline advanced correctly from step 1 to step 2 — proving the
incident-#1 fixes (especially the `deliverAs` rename, committed `6908c35` at 08:43:26Z, before
this run started at 08:45:14Z) work. Step 2 (`pipeline-discover`, non-gated) then executed and
produced all its artifacts, but the chain **stalled at step 2 and never auto-advanced to step 3**.
The user observed: *"the pipeline stops at step 2 instead of auto-progressing and only stops at
gated steps."*

**Root cause (Bug #5):** The `CompletionWatcher` for step 2 polls the step's declared primary
artifact, `step2-discover/snapshot.yaml` (`getPrimaryArtifactPath(2)` /
`workflows/manifest.yaml:38`). But the agent wrote the `@step-complete step=2` marker into a
**different, self-invented file**, `step2-discover/discovery-metadata.json`. The watched file
(`snapshot.yaml`) ends with an ARIA-snapshot tail (`- alert`) and never received the marker, so
`onStepComplete(2)` never fired and the chain died at the step 2→3 transition.

This is **not** a format problem — `snapshot.yaml` is YAML and can host a `# @step-complete`
comment. It is an **artifact-selection mismatch**: the completion-marker instruction in
`dispatchStep()` told the agent to mark *"the PRIMARY ARTIFACT"* without ever naming **which
file**, and `pipeline-discover.md:21` describes `snapshot.yaml` as written *"for backward
compatibility"* — so the agent reasonably treated it as secondary and placed the completion
metadata in the file it considered canonical (`discovery-metadata.json`, which is not mentioned
in the prompt or manifest at all).

**Relationship to Bug #1:** incident #1's Bug #1 was the identical class — step 1's JSON primary
artifact couldn't host a comment, so the agent wrote the marker to a sidecar `completion.md` the
watcher never polled. That fix added JSON-format guidance to the instruction, which patched the
**step-1 instance** but left the **class** open: the watched path and the agent's marker
placement were still chosen independently, with no shared source of truth and no instruction
naming the exact file. Bug #5 is that open class resurfacing at step 2.

### Impact

| Dimension | Details |
|---|---|
| **Pipelines affected** | 1 run: `automation-in-testing/public-home/2026-05-30T084514Z` |
| **Where it stalled** | Step 2→3 transition (first time the chain ever reached step 2, thanks to the incident-#1 fixes) |
| **Duration impact** | Run required manual prompting to proceed past step 2 instead of auto-chaining through non-gated steps 2→3 (and likely the same at 6→7, 7→8 had it continued) |
| **Artifact correctness** | All step 1 and step 2 artifacts produced correctly; only orchestration broke, not content |
| **User experience** | Agent went idle at step 2; user had to detect and report the stall again |
| **Data loss** | None |
| **Other flows/apps** | None directly, but the defect is **general** — any step whose primary artifact is ambiguous or demoted could stall the same way |

### Root Cause

#### Bug #5 (Run 084514Z): completion marker written to a non-watched sibling file

1. **The watcher polls one hardcoded primary artifact per step.** For step 2,
   `getPrimaryArtifactPath(2)` (`index.ts:224`) returns
   `step2-discover/snapshot.yaml`, matching `workflows/manifest.yaml:38`
   (`primary_output.path` for the `discover` step). The watcher reads only the last 512 bytes of
   that single file.

2. **The agent wrote the marker into `discovery-metadata.json`, not `snapshot.yaml`:**
   ```
   $ grep -rn '@step-complete' step2-discover/
   discovery-metadata.json:23:  "_stepComplete": "@step-complete step=2 runId=2026-05-30T084514Z"
   ```
   `snapshot.yaml` exists (5,125 bytes) and is non-empty, but its tail is
   `… - link "Admin panel": … - alert` — no marker. The watcher polled it indefinitely and never
   matched.

3. **The marker instruction never names the watched file.** Before this fix, `dispatchStep()`
   (`index.ts:404–405`) said *"verify the PRIMARY ARTIFACT contains this marker"* and listed
   format syntaxes, but did **not** tell the agent which file is the primary artifact. The
   watcher knows (it computes `getPrimaryArtifactPath`); the agent had to guess.

4. **The step-2 prompt actively demotes `snapshot.yaml`.** `pipeline-discover.md:21`:
   *"For backward compatibility, **also** write … `snapshot.yaml` with the merged snapshot."* This
   framing makes `snapshot.yaml` read as a secondary compatibility artifact, so the agent put the
   completion **metadata** key in a metadata file (`discovery-metadata.json`) it created for the
   purpose. That file is not referenced in the prompt or the manifest — it is agent-invented.

5. **Step 1 worked because its dispatch message names the exact file.** The step-1 branch of
   `dispatchStep()` (`index.ts:396`) explicitly instructs *"Write run metadata to
   `…/step1-resolve/run-metadata.json`"* — the same file the watcher polls — so the marker landed
   in the watched file. No other step's dispatch message names its primary file; they fall through
   to the generic `/${stepName} ${app} ${runId}` template plus the unnamed-file marker
   instruction.

#### Causal chain (Bug #5)

```
deliverAs fix (6908c35) lands 08:43:26Z → auto-chaining works past step 1 for the first time
Run 084514Z starts 08:45:14Z
dispatchStep(1) names step1-resolve/run-metadata.json inline
    → Agent writes _stepComplete into run-metadata.json (the watched file) ✓ (08:46:06Z)
    → CompletionWatcher(step 1) matches → onStepComplete(1) fires → currentStep advances to 2 ✓
dispatchStep(2) sends "/pipeline-discover …" + marker instruction that does NOT name the file
    → Agent writes snapshot.yaml (08:47:54Z, "backward compatibility" artifact, no marker)
    → Agent writes discovery-metadata.json (08:48:11Z) and puts the _stepComplete key THERE
    → CompletionWatcher(step 2) polls snapshot.yaml only → tail is "- alert", no marker
    → onStepComplete(2) NEVER fires
    → currentStep stays at 2; agent goes idle
    → Chain dead at the step 2→3 transition
```

### Trigger

The incident-#1 fixes removing every barrier that had previously stopped the chain at step 1.
Once auto-chaining reached step 2 for the first time, the latent watched-path-vs-marker-placement
mismatch (dormant because the chain had never gotten this far) became the new sole failure mode.
Triggered by: `/pipeline-run automation-in-testing FLOW_ID=public-home`.

### Resolution

**Fix — `.pi/extensions/pipeline-runner/index.ts`** (applied to working tree; commit pending):

Make `getPrimaryArtifactPath()` the single source of truth for **both** the watch and the
agent instruction, and name the exact file (with the exact marker line for its format) in the
dispatch message.

1. New helper `markerLineFor(filePath, step, runId)` — returns the correct marker line based on
   the file extension (`.json` → `_stepComplete` key; `.ts/.js` → `//`; `.yaml/.yml` → `#`;
   else → `<!-- -->`).

2. `dispatchStep()` now resolves the watched artifact path **before** building the instruction,
   computes the repo-relative path, and embeds it:
   ```
   **COMPLETION SIGNALING (MANDATORY):** The pipeline watcher polls exactly ONE file …:

     <relArtifact>

   Before you finish, that exact file MUST contain this completion marker (do NOT put it in any
   other file, sidecar, or metadata JSON — the watcher will not see it there):

     <markerLine>
   ```
   The watcher is then registered for the **same** `artifactPath`. Agent and watcher can no longer
   diverge, for any step — this closes the class, not just the step-2 instance.

**Test coverage — `.pi/extensions/pipeline-runner/marker-regex.test.ts`:**
Added an incident-#5 before/after regression at the watcher level:
- step 2 `snapshot.yaml` with an ARIA tail and **no** marker → must NOT match (the bug)
- step 2 `snapshot.yaml` with `# @step-complete step=2 …` appended as the final line → must match (the fix)

Result: **11/11 pass**. `tsc --noEmit`: clean for both files.

**Verification still required (runtime):**
- Restart the pi-coding-agent session (the extension is loaded in-memory at session start and
  does not hot-reload — see incident #1 Action Item #14).
- Re-run `/pipeline-run automation-in-testing FLOW_ID=public-home` and confirm step 2→3
  auto-advances and the chain proceeds to the first gate (step 4).

### Detection

- **How detected**: User observation — *"the pipeline stops at step 2 instead of auto-progressing
  and only stops at gated steps."* User invoked `/systematic-debugging` with run ID
  `2026-05-30T084514Z`.
- **Time to detect**: Immediately after the run reached step 2.
- **What investigation found**: `grep '@step-complete'` showed the step-2 marker only in
  `discovery-metadata.json`, never in the watched `snapshot.yaml`; the snapshot tail confirmed no
  marker; the `deliverAs` fix was confirmed present (`index.ts:414,536`) and an ancestor of HEAD,
  ruling out an incident-#4 regression.
- **Alert mechanism**: None — same gap as incident #1. A stalled watcher emits no warning; the
  user is the only detector. (Incident #1 Action Item #5 — a watcher heartbeat/timeout warning —
  would have surfaced this automatically.)

### Action Items

| # | Action | Priority | Owner | Status |
|---|---|---|---|---|
| 1 | Name the exact watched file + exact marker line in the `dispatchStep()` completion instruction (single source of truth via `getPrimaryArtifactPath`) | P0 | @ryga | ✅ Done (working tree; commit pending) |
| 2 | Add incident-#5 regression to `marker-regex.test.ts` (step 2 snapshot.yaml with/without marker) | P1 | @ryga | ✅ Done (11/11) |
| 3 | Commit the fix and verify at runtime after a session restart + fresh run | P0 | @ryga | ⬜ Pending |
| 4 | **Watcher heartbeat/timeout warning** — if a step's watcher has not fired within N seconds of dispatch, emit a visible warning. Would have auto-detected incidents #1, #2, #3, and #5. (Carried from incident #1 AI #5.) | P1 | — | Backlog |
| 5 | **`await` every `pi.sendUserMessage`** so rejections surface (carried from incident #1 AI #11). Not the cause of #5, but the silence that lets these stalls go undetected shares this root. | P1 | — | Backlog |
| 6 | **End-to-end auto-chaining test** that drives the dispatch loop (not just the regex) across all 8 steps with realistic artifact layouts. Every incident so far (#1–#5) escaped because only the regex is unit-tested; the dispatch/watch/marker-placement loop is not. | P1 | — | Backlog |
| 7 | **Reconcile primary-artifact framing in prompts.** `pipeline-discover.md:21` calls `snapshot.yaml` a "backward compatibility" file while the manifest declares it the `primary_output`. Either make the prompt call it the primary artifact, or change the manifest/watcher to a file the prompt treats as canonical. Mismatched framing invites the agent to mark the wrong file. | P2 | — | Backlog |
| 8 | **Watcher directory-scan as defense-in-depth.** Consider scanning the whole step directory for the `step=N` marker in any file, so an agent's file choice cannot break the chain even if the instruction is ignored. (Relates to incident #1 AI #4/#8.) | P2 | — | Backlog |

### Lessons Learned

#### What went well
- The incident-#1 fixes were genuinely correct: the chain advanced past step 1 for the first
  time, and the `deliverAs` fix was confirmed in source and in HEAD history — this was a new bug,
  not a regression.
- Artifact mtimes + `grep` gave a precise, dispositive diagnosis without needing the pi session
  log: snapshot.yaml (08:47:54Z) and discovery-metadata.json (08:48:11Z) showed exactly which
  file got the marker.
- The fix generalizes — naming the watched file closes the mismatch class for all 8 steps, not
  just step 2.

#### What went wrong
- **The class was never fixed, only an instance.** Incident #1 Bug #1 was the same
  watched-path-vs-marker-placement mismatch. Patching step 1 with JSON-format guidance left the
  underlying flaw (no shared source of truth, instruction never names the file) intact. This is
  the `systematic-debugging` Phase 4.5 signal: each fix exposed the next instance of the same
  defect in a different place. Five incidents in one subsystem in one day is an
  under-tested-architecture signal, not five unrelated bugs.
- **The marker instruction described a role ("the PRIMARY ARTIFACT") instead of an address (a
  path).** The watcher used an address; the agent was given a role and had to guess which file
  filled it. Roles are ambiguous; addresses are not.
- **Prompt and manifest disagreed on what "primary" means.** The manifest declared `snapshot.yaml`
  the primary output; the prompt called it a backward-compatibility extra. The agent followed the
  prompt's framing.
- **Coverage tested the regex, never the loop.** Every incident #1–#5 slipped past a green test
  suite because the tests only assert the regex matches a hand-written marker string — they never
  exercise dispatch → agent file choice → watch. The thing that keeps breaking is the part with no
  test.

#### Where we got lucky
- Step 2 is reached early, so the stall was obvious immediately rather than deep in the pipeline.
- `snapshot.yaml` is YAML (comment-friendly), so the fix is purely "tell the agent to write here"
  — no format workaround needed. Had the primary artifact been a format that genuinely cannot host
  a marker, the fix would have needed a sidecar convention (incident #1 AI #8) as well.

### Timeline

| Time (UTC) | Event |
|---|---|
| 08:43:26 | `deliverAs` fix committed (`6908c35`); merged at 08:43:37 (`5fc4f79`) — incident #1 fully resolved |
| 08:45:14 | **Run 084514Z**: pipeline invoked via `/pipeline-run automation-in-testing FLOW_ID=public-home` |
| 08:46:06 | Step 1 writes `run-metadata.json` with `_stepComplete` in the watched file ✓ → watcher fires → advance to step 2 (first time the chain ever advances) |
| 08:47:54 | Step 2 writes `snapshot.yaml` (the watched file) — "backward compatibility" merged snapshot, **no marker** |
| 08:48:11 | Step 2 writes `discovery-metadata.json` with `_stepComplete` — marker lands in the **wrong** file |
| 08:48:11+ | Watcher(step 2) keeps polling `snapshot.yaml`; tail is `- alert`, no marker → `onStepComplete(2)` never fires |
| ~08:49 | Agent finishes step 2 turn and goes idle; chain dead at step 2→3 — **Bug #5** |
| (later) | User reports stall with run ID `2026-05-30T084514Z`, invokes `/systematic-debugging` |
| (later) | Investigation: `grep` confirms marker only in `discovery-metadata.json`; `deliverAs` confirmed present and ancestor of HEAD (not a regression) |
| (later) | Fix applied to `index.ts` (`markerLineFor` + name exact file in `dispatchStep`); regression added to tests (11/11); `tsc` clean |

### Supporting Information

- **Affected run**: `results/automation-in-testing/flows/public-home/2026-05-30T084514Z/`
- **Pipeline branch**: `pipeline/automation-in-testing/public-home/2026-05-30T084514Z`
- **Extension file**: `.pi/extensions/pipeline-runner/index.ts`
  - Bug #5 location: `dispatchStep()` marker instruction (formerly `index.ts:404–405`) — did not name the watched file
  - `getPrimaryArtifactPath(2)` → `step2-discover/snapshot.yaml` (`index.ts:224`)
  - Fix: new `markerLineFor()` helper + `dispatchStep()` resolves and names the exact `relArtifact`
- **Prompt**: `.pi/prompts/pipeline-discover.md:21` — describes `snapshot.yaml` as "for backward compatibility"
- **Manifest**: `workflows/manifest.yaml:37–39` — declares `snapshot.yaml` the step-2 `primary_output`
- **Test file**: `.pi/extensions/pipeline-runner/marker-regex.test.ts` (11 cases, incl. incident-#5 before/after)
- **Watcher regex**: `@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)` (correct since incident #1 Phase 2 / commit `2563fd6`)
- **Prior incident**: `docs/postmortems/2026-05-30-pipeline-chaining-failure-completion-marker-json.md` (incident #1, Bugs #1–#4) — Bug #5 is the same class as that document's Bug #1
- **Relevant commits**: `6908c35` (`deliverAs` fix, predates this run), `ba4f57c` (current HEAD at investigation)
