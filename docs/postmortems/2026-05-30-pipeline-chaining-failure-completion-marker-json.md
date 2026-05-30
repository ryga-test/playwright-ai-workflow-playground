# Pipeline Auto-Chaining Failure — Step 1 Completion Marker Not Detected (incident #2026-05-30-001)

### Date
2026-05-30 06:53–08:55 UTC (four runs affected)

### Authors
- @ryga (reporter, investigator)

### Status
Resolved (three-phase fix, four incidents).

- **Phase 1** (line 406): added JSON format to marker instruction, committed `ccacaf8` at `2026-05-30T07:10Z`.
- **Phase 2** (line 147): fixed template-literal escaping bug in watcher regex, **documented at 08:10Z but not actually applied to source**; run `081427Z` still failed for the same Phase 2 reason. The Phase 2 source edit was applied in commit `2563fd6` at `2026-05-30T08:26Z`.
- **Phase 3** (lines 414 & 536): renamed `sendUserMessage` option from `streamingBehavior` to `deliverAs` to match pi-coding-agent v0.78.0's actual API. Without this, `onStepComplete` advanced state to step 2 correctly but the followup user-message was silently dropped because the unknown option key left `deliverAs` undefined and the underlying `prompt()` threw "Agent is already processing" inside an un-awaited Promise. Surfaced by run `083040Z`, fixed in commit `6908c35` at `~08:55Z`.

Test coverage was added with Phase 1 and verifies the fixed regex (test file already used correct escaping, which is why the prior commit looked "done" without runtime verification). There is **no test coverage** for the `deliverAs` option name — that gap is a Phase 3 action item.

### Summary

The pipeline-runner extension's CompletionWatcher never detected the step-1 completion marker,
breaking auto-chaining for the entire run. Two separate bugs were found:

**Bug #1 (JSON instruction gap):** On run `2026-05-30T065319Z`, the agent wrote the marker
to a separate `completion.md` file because the marker instruction only covered comment-based
formats and step 1's primary artifact is JSON. The watcher polled only the JSON file and
never saw the sidecar marker.

**Bug #2 (regex escaping):** After Bug #1 was fixed (JSON format added to instructions), the
next run `2026-05-30T080248Z` still failed to auto-advance. The marker was correctly written
into `run-metadata.json` as a `_stepComplete` key, but the CompletionWatcher regex used a
**template-literal escaping bug**: `\w` evaluates to just `w` in a JS template literal, so
the actual regex `[w-]+T[w:]+Z?` could never match run IDs containing digits. This bug
affected **all** artifact formats — the watcher was silently broken since introduction.

**Bug #3 (documented-but-not-applied fix — third incident, run `2026-05-30T081427Z`):**
The Phase 2 fix for Bug #2 was written into the postmortem but **never landed in the source
file**. No commit, no working-tree edit. Run `081427Z` invoked the pipeline against the same
broken regex on line 147 and died at step 1 for the identical Bug #2 reason. The Phase 2
source edit was actually applied during the systematic-debugging investigation of the third
incident at `08:26Z` — see the Resolution and Timeline sections for the corrected sequence.

**Bug #4 (wrong option name on `sendUserMessage` — fourth incident, run `2026-05-30T083040Z`):**
With the regex finally fixed, the watcher fired correctly: the session log shows
`pipeline-state` advancing to `currentStep: 2, stepMarkerReceived: true` at `08:31:33.308Z`.
But no step 2 user message ever followed — the agent finished its step 1 turn at `08:31:53Z`
and the chain died there. Root cause: `dispatchStep` calls
`pi.sendUserMessage(message, { streamingBehavior: "followUp" })`, but pi-coding-agent v0.78.0
reads `options.deliverAs` (see `dist/core/agent-session.js:1037`); `streamingBehavior` is
silently ignored. With `deliverAs` undefined and the agent still streaming the previous
turn, the underlying `prompt()` throws `"Agent is already processing. Specify
streamingBehavior ('steer' or 'followUp') to queue the message."`. The runner calls
`sendUserMessage` without `await`, so the rejection is unhandled and the step 2 message is
dropped on the floor. `git blame` shows this is a **regression**: commit `b8dc870a`
(Phase 2 core refactor, 2026-05-22) reverted both call sites from `deliverAs` back to
`streamingBehavior`, undoing the earlier rename in `4532e9b` ("update extension for followUp
deliverAs"). Bugs #1–#3 masked Bug #4: the watcher never fired in runs `065319Z`, `080248Z`,
or `081427Z`, so `dispatchStep` was never called for step 2 and the wrong option name had no
chance to surface.

**Prior runs on `main` were not affected** because they used the older `agent_end` event-driven
chaining path, which has its own fragility but happened to work for those step shapes.

### Impact

| Dimension | Details |
|---|---|
| **Pipelines affected** | 4 runs: `automation-in-testing/public-home/2026-05-30T065319Z` (Bug #1), `…/080248Z` (Bug #2), `…/081427Z` (Bug #3 — Bug #2 fix never applied), `…/083040Z` (Bug #4 — regex finally working, but `sendUserMessage` option name regressed) |
| **Duration impact** | Each affected run required manual `/pipeline-continue` or equivalent prompting at every step instead of auto-chaining through non-gated steps |
| **Artifact correctness** | Across affected runs the artifacts that were produced were correct; only orchestration was broken, not content |
| **User experience** | Agent needed explicit prompting to proceed after each step — user had to babysit the pipeline four separate runs in a row |
| **Data loss** | None |
| **Other flows/apps** | None affected — auto-chaining was broken for every run until commit `6908c35` at ~08:55Z |

### Root Causes

#### Bug #1 (Run 065319Z): JSON format missing from marker instruction

1. **The completion marker format instruction in `dispatchStep()` (`index.ts` line 406) covered only comment-based formats** (Markdown, TypeScript, YAML) but not JSON. Step 1's primary artifact is JSON (`run-metadata.json`), which cannot host inline comments without breaking the file.

2. **The agent correctly identified the format constraint** — it wrote the marker to a separate `completion.md` file to avoid corrupting the JSON. This was the rational behavior: when told "append the marker as the final line" and the file is JSON, a separate file is the only non-destructive option.

3. **The CompletionWatcher polls only the declared primary artifact path**. There is no fallback or companion-file scanning.

4. **No test coverage existed** for the completion marker regex across all artifact formats. JSON was never validated.

#### Bug #2 (Run 080248Z): Template-literal escaping breaks watcher regex for ALL formats

5. **`CompletionWatcher.poll()` line 147 uses a JS template literal with single-escaped `\w`**:
   ```typescript
   // PRODUCTION (broken):
   new RegExp(`@step-complete step=${step} runId=([\w-]+T[\w:]+Z?)`)
   
   // After template literal processing, `\w` → `w`, producing the regex:
   // /@step-complete step=1 runId=([w-]+T[w:]+Z?)/
   ```
   The character class `[w-]` matches only literal `w` and hyphens. Real run IDs contain
digits (`2026`, `05`, `080248`) and colons, which the regex can never match. This bug silently
affected **all** artifact formats (Markdown, YAML, TS, JSON, Gherkin) — the watcher had
been unable to detect any marker since introduction.

6. **The test file (`marker-regex.test.ts` line 19) uses the correct escaping** (`\\w`),
   so the 9 test cases all pass — the production code was never verified at runtime:
   ```typescript
   // TEST (correct):
   new RegExp(`@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)`)
   // Produces: /@step-complete step=1 runId=([\w-]+T[\w:]+Z?)/
   ```

#### Bug #3 (Run 081427Z): Phase 2 fix documented but never applied to source

7. **No commit, no working-tree edit corresponded to the Phase 2 fix.** `git log` shows only
   `ccacaf8` (Phase 1) on `.pi/extensions/pipeline-runner/index.ts`. `git diff HEAD` was empty
   at the start of the third-incident investigation. Line 147 still contained the broken
   single-escape `[\w-]+T[\w:]+Z?` form.

8. **The postmortem was written first, with the fix described as if applied.** Because the
   test file (`marker-regex.test.ts`) already used the correct `\\w` and continued to pass,
   nothing automated noticed that production never received the change. The "Phase 2 ✅ Done"
   status was a documentation-only claim.

9. **There was no runtime verification step** between writing the postmortem and the next
   pipeline run. No CI assertion, no smoke test, no manual `git diff` review.

#### Bug #4 (Run 083040Z): `sendUserMessage` called with wrong option key (regression)

10. **`dispatchStep()` line 414 and `pipeline-continue` line 536 both used `streamingBehavior`
    instead of `deliverAs`:**
    ```typescript
    // Broken (lines 414 and 536):
    pi.sendUserMessage(message, { streamingBehavior: "followUp" });
    // pi-coding-agent v0.78.0 reads options.deliverAs only — streamingBehavior is silently ignored
    ```
    Verified against the installed package's compiled implementation
    (`@earendil-works/pi-coding-agent@0.78.0`, `dist/core/agent-session.js:1037`):
    ```js
    await this.prompt(text, {
      expandPromptTemplates: false,
      streamingBehavior: options?.deliverAs,   // ← reads deliverAs, not streamingBehavior
      images,
      source: "extension",
    });
    ```

11. **When the agent is mid-turn (still streaming step 1 work) and `deliverAs` is undefined,
    `prompt()` throws** (`agent-session.js:737–738`):
    ```js
    if (!options?.streamingBehavior) {
      throw new Error("Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message.");
    }
    ```
    The runner calls `sendUserMessage` **without `await`** (line 414), so the rejected
    Promise becomes an unhandled rejection. No error surfaces, the step 2 message is dropped.

12. **`git blame` shows this is a regression**: commit `b8dc870a` (Phase 2 core refactor,
    2026-05-22 06:41 +0700) reverted both call sites from `deliverAs` back to
    `streamingBehavior`, undoing the earlier rename made nine days prior in commit
    `4532e9b` ("chore(pipeline): update extension for followUp deliverAs"). The pi-coding-agent
    API had been renamed; the extension was updated to match; the refactor lost the update.

13. **Bug #4 was masked by Bugs #1–#3.** Until the regex was actually fixed in `2563fd6`
    (Phase 2 source edit, 08:26Z), the watcher never fired, so `onStepComplete` never ran,
    so `dispatchStep(2)` was never called, so the wrong option key never had a chance to
    fail. The chain of bugs created a perfect curtain over Bug #4.

#### Causal chain (all four bugs)

**Run 065319Z:**
```
dispatchStep(1) sends marker instruction listing only comment formats
    → Agent writes marker to completion.md (can't put comment in JSON)
    → CompletionWatcher polls step1-resolve/run-metadata.json
        → Last 512 bytes of run-metadata.json: "...\n}" (no marker)
    → onStepComplete(1) never fires
    → Entire auto-chaining chain dead from step 1 onward
```

**Run 080248Z (after Bug #1 fix):**
```
dispatchStep(1) sends marker instruction with JSON format
    → Agent writes _stepComplete key into run-metadata.json ✓
    → CompletionWatcher polls step1-resolve/run-metadata.json
        → Regex [w-]+T[w:]+Z? cannot match "2026-05-30T080248Z" (digits, colons)
    → onStepComplete(1) never fires
    → Entire auto-chaining chain dead from step 1 onward
```

**Run 081427Z (after Bug #2 was documented as fixed — but the fix never landed):**
```
Postmortem claims Phase 2 fix applied at 08:10Z; no commit or working-tree edit exists
    → Line 147 still has broken [\w-]+T[\w:]+Z? regex
    → dispatchStep(1) sends marker instruction with JSON format ✓
    → Agent writes _stepComplete key into run-metadata.json ✓
    → CompletionWatcher polls step1-resolve/run-metadata.json
        → Same regex still cannot match digits
    → onStepComplete(1) never fires (identical failure mode as run 080248Z)
    → Entire auto-chaining chain dead from step 1 onward, third run in a row
```

**Run 083040Z (after Bug #2 source edit finally applied in commit 2563fd6):**
```
dispatchStep(1) sends marker instruction with JSON format ✓
    → Agent writes _stepComplete key into run-metadata.json ✓
    → CompletionWatcher polls step1-resolve/run-metadata.json
        → Regex [\w-]+T[\w:]+Z? now matches "2026-05-30T083040Z" ✓
    → onStepComplete(1) fires at 08:31:33Z ✓
    → State persists with stepMarkerReceived=true, currentStep advances to 2 ✓
    → dispatchStep(2) called → pi.sendUserMessage(msg, { streamingBehavior: "followUp" })
        → pi-coding-agent ignores streamingBehavior, reads undefined deliverAs
        → Agent is mid-turn → prompt() throws "Agent is already processing"
        → Promise rejection unhandled (caller doesn't await) → message dropped
    → No step 2 user message ever logged in session ✗
    → Agent finishes its step 1 turn at 08:31:53Z and goes idle
    → Chain dead from step 1→2 transition, fourth run in a row
```

### Trigger

**Bug #1:** Normal pipeline invocation exposed the JSON instruction gap the first time step 1
needed the marker under the Phase 2 code path.

**Bug #2:** The regex escaping bug was latent from the initial Phase 2 implementation (commit
`2af563a`) — it was never triggered under `agent_end` chaining. It became the sole remaining
failure mode after the Bug #1 JSON instruction fix was deployed.

**Bug #3:** Triggered by writing the postmortem before editing the source. The Phase 2 fix
description was correct on paper but never executed against the file, so the next pipeline
run (`081427Z`) hit Bug #2's failure path verbatim.

**Bug #4:** Latent regression from commit `b8dc870a` (Phase 2 core refactor, 2026-05-22).
The refactor reverted both `sendUserMessage` option keys from `deliverAs` back to
`streamingBehavior`. It could not surface until the watcher actually fired and
`dispatchStep` was invoked for step 2 — which only happened once Bug #2 was truly fixed in
run `083040Z`.

All four were triggered by: `/pipeline-run automation-in-testing FLOW_ID=public-home`.

### Resolution

**Phase 1 fix — `.pi/extensions/pipeline-runner/index.ts` line 406** (applied 07:10 UTC, run 065319Z):

Added a JSON entry to the completion marker instruction block:

```
"_stepComplete": "@step-complete step=${step} runId=${runId}"  (JSON — last key before closing })
```

This resolved Bug #1 (format gap) — the agent now writes the marker directly into
`run-metadata.json` as a JSON key instead of a separate sidecar file. **However, the
watcher still failed to detect the marker due to Bug #2.**

**Phase 2 fix — `.pi/extensions/pipeline-runner/index.ts` line 147** (**documented at 08:10Z but actually applied at 08:26Z, during the third-incident investigation after run `081427Z` failed identically**):

Fixed the template-literal escaping bug in `CompletionWatcher.poll()`:

```diff
- const markerRegex = new RegExp(`@step-complete step=${step} runId=([\w-]+T[\w:]+Z?)`);
+ const markerRegex = new RegExp(`@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)`);
```

`\w` → `\\w` (single character class repair). After template literal processing, the
regex becomes `[\w-]+T[\w:]+Z?` which correctly matches digits, letters, and underscores
in run IDs. This was the **true root cause** of the watcher failure — the watcher regex
was silently broken for all artifact formats since initial implementation.

**Verification of the actual Phase 2 application (08:26Z):**
- `grep -n` confirms line 147 now reads `[\\w-]+T[\\w:]+Z?` in source
- Node repro against the real tail bytes of `2026-05-30T081427Z/step1-resolve/run-metadata.json`: the fixed regex returns a match with capture `2026-05-30T081427Z`; the broken regex returns `null`
- `marker-regex.test.ts` continues to pass 9/9

**Phase 3 fix — `.pi/extensions/pipeline-runner/index.ts` lines 414 & 536** (commit `6908c35` at ~08:55Z, run `083040Z`):

```diff
- pi.sendUserMessage(message, { streamingBehavior: "followUp" });
+ pi.sendUserMessage(message, { deliverAs: "followUp" });

- pi.sendUserMessage("approved", { streamingBehavior: "followUp" });
+ pi.sendUserMessage("approved", { deliverAs: "followUp" });
```

Restores the API contract for pi-coding-agent v0.78.0. Without this, the queue/follow-up
behavior was never activated and step 2 (and every subsequent auto-advance) was silently
dropped when the previous turn was still streaming.

**Verification of the Phase 3 application (~08:55Z):**
- Read against installed package: `dist/core/agent-session.js:1037` reads `options?.deliverAs`
- Session log for run `083040Z` already proves the regex fix worked (state advanced to step 2 at 08:31:33Z); only the followup dispatch was missing, which exactly matches the symptom of a silently-dropped `sendUserMessage`
- `marker-regex.test.ts` continues to pass 9/9 (regex unchanged)
- **No direct test exists** for the `deliverAs` option name — the wrong key compiles cleanly under both the TS type definition (`options?` is structural and ignores unknown keys) and the runtime (passed through to `prompt()` and dropped). See Action Item #10.

**Test coverage** (`.pi/extensions/pipeline-runner/marker-regex.test.ts`): 9 test cases covering
JSON (`_stepComplete` key), Markdown, YAML, TypeScript, Gherkin formats, plus negative tests
(missing marker, wrong step). The test file already used correct escaping (`\\w`) and passed,
but the production code had the wrong escaping (`\w`).

### Detection

**Incident #1 (065319Z):**
- **How detected**: User observation — the agent was asking for continuation at steps that should have been automatic
- **Time to detect**: ~5 minutes into the run (step 1 → step 2 transition failed to auto-advance)

**Incident #2 (080248Z):**
- **How detected**: User observation — pipeline still not auto-progressing after Phase 1 fix was deployed
- **Time to detect**: Immediately on first step after new run started
- **Alert mechanism**: None (auto-chaining failure has no programmatic alert; the user is the detector)

**Incident #3 (081427Z):**
- **How detected**: User observation — pipeline still stopped after step 1 even though the postmortem said both fixes were "applied". The user invoked `/systematic-debugging` with the failing run path.
- **Time to detect**: Immediately on first step after new run started
- **What investigation found**: `git diff HEAD` was empty and `git log` showed only the Phase 1 commit (`ccacaf8`). Line 147 still contained the broken `[\w-]` form. The Phase 2 fix had been written into this document but never executed against the source file.
- **Alert mechanism**: None — same gap as incidents #1 and #2, plus a new gap: no automated check that a documented fix has actually landed in code.

**Incident #4 (083040Z):**
- **How detected**: User observation — "the fix does not work … step 1 still stop after complete" after the Phase 2 source edit was merged. User invoked the systematic-debugging flow again.
- **Time to detect**: Immediately on first step after new run started
- **What investigation found**: The pi-coding-agent session log shows the watcher *did* fire — pipeline-state advanced to `currentStep: 2, stepMarkerReceived: true` at `08:31:33.308Z`. But the session contains only **one** `role: "user"` event (the step 1 dispatch); no step 2 message ever followed. Cross-referencing the installed pi-coding-agent build confirmed `sendUserMessage` reads `options.deliverAs`, not `options.streamingBehavior`. `git blame` showed the regression was introduced by commit `b8dc870a` during the Phase 2 core refactor.
- **Alert mechanism**: None — `sendUserMessage` is called without `await`, so the rejected Promise is unobserved. The TypeScript type `options?: { deliverAs?: ... }` is structural and silently accepts unknown keys, so the bug compiles. Action Items #10 and #11 close these gaps.

## Action Items

| # | Action | Priority | Owner | Status |
|---|---|---|---|---|
| 1 | Add JSON format to completion marker instruction in `dispatchStep()` | P0 | @ryga | ✅ Done (Phase 1, committed `ccacaf8`) |
| 2 | Fix template-literal escaping in watcher regex (`\w` → `\\w`) | P0 | @ryga | ✅ Done (Phase 2, applied 08:26Z — initially documented at 08:10Z but the source edit did not land until after incident #3) |
| 3 | Add marker-regex test covering all artifact formats | P1 | @ryga | ✅ Done |
| 4 | Align production regex escaping with test file escaping — add lint/enforcement (e.g., an integration check that compiles the live `markerRegex` and asserts it matches a known-good marker, so test-production divergence is impossible) | P1 | — | Backlog |
| 5 | Consider adding a watcher integrity check: if step 1 watcher hasn't fired within N seconds of dispatch, emit a warning | P2 | — | Backlog |
| 6 | Audit all 8 `getPrimaryArtifactPath` entries: confirm each primary artifact format matches its instruction entry | P2 | — | Done (only step 1 is JSON) |
| 7 | Add pipeline health metric: `steps_auto_advanced` vs `steps_manual_prompted` per run | P3 | — | Backlog |
| 8 | Consider a format-agnostic marker sidecar convention (e.g., `<artifact>.step-complete`) as defense-in-depth for formats that cannot host markers inline | P3 | — | Backlog |
| 9 | **Process: postmortem-to-source verification.** When a fix is described in a postmortem, the corresponding code change must be staged or committed before the postmortem's Status/Resolution/Action-Item entries are marked done. Add a checklist line or lightweight pre-merge check that fails if a postmortem references `lineN` of a file but `git log -L` shows no edit there since the postmortem timestamp. | P1 | — | Backlog (root cause of incident #3) |
| 10 | Rename `sendUserMessage` option from `streamingBehavior` to `deliverAs` at both call sites (lines 414, 536) — match pi-coding-agent v0.78.0 API | P0 | @ryga | ✅ Done (commit `6908c35`, Phase 3) |
| 11 | **`await` every `pi.sendUserMessage` call** in the extension so rejections (e.g. "Agent is already processing") surface as visible failures instead of unhandled-rejection warnings. Today the runner calls `sendUserMessage` fire-and-forget; that is what hid Bug #4 for nine days. | P1 | — | Backlog (root cause of incident #4 being silent) |
| 12 | **Lint / runtime assertion against unknown option keys on `sendUserMessage` (and similar extension APIs).** The TS overload `options?: { deliverAs?: ... }` is structural and silently accepts `{ streamingBehavior: ... }`. Add a wrapper that whitelists known keys, or a CI lint rule against `streamingBehavior:` on `sendUserMessage` call sites. | P1 | — | Backlog (root cause of incident #4) |
| 13 | **Pin pi-coding-agent version and document the supported API in this repo** (e.g. an ADR or `.pi/EXTENSION-API.md`). Bug #4 was an API rename across versions that the extension half-followed and then un-followed during a refactor. A pinned version + a one-page reference would catch the next rename. | P2 | — | Backlog |
| 14 | **Restart pi-coding-agent session after extension edits.** The extension is loaded into the pi process at session start; in-memory code does not hot-reload when `.pi/extensions/pipeline-runner/index.ts` changes on disk. Document this in the `/pipeline-run` help text and in `CLAUDE.md`, or add a `/pipeline-reload` command that re-imports the extension. The user's "/fix didn't work" cycle was partly this gotcha after the Phase 2 source edit. | P2 | — | Backlog |

## Lessons Learned

### What went well
- The agent exhibited rational behavior: when a format constraint blocks the instruction, it finds a non-destructive alternative (separate `completion.md`)
- Both bugs were isolated to single-line changes; no structural redesign needed
- All pipeline artifacts were produced correctly — only the orchestration was broken, not the content
- The test file had the correct escaping (`\\w`), which made cross-referencing the bug obvious once the production code was inspected

### What went wrong
- **Format-blind instruction design**: The completion marker instruction assumed all primary artifacts are comment-friendly formats. JSON was an unhandled variant.
- **Template-literal escaping bug**: `\w` in a JS template literal evaluates to just `w`, not `\w`. The regex `[w-]` silently only matched literal `w` — no digits, no letters, no underscores. The silent failure was never caught because there is no runtime assertion that the watcher regex can match a valid run ID.
- **Test-production divergence**: The test file used correct escaping (`\\w`) while the production code used incorrect escaping (`\w`). Tests passed, production silently failed. No lint rule or automated check caught the discrepancy.
- **No format-to-instruction validation**: There's no mapping or check that the declared primary artifact format has a matching entry in the marker instruction template.
- **Single-point-of-failure chaining**: One marker miss kills the entire chain. There's no heartbeat, timeout, or secondary detection mechanism.
- **Postmortem written ahead of the source change (incident #3)**: Status, Resolution, Timeline, and Action Item #2 were all marked ✅ Done for Phase 2 *before* the corresponding edit was committed or even saved to the working tree. The next pipeline run silently exercised the unfixed code. Documenting a fix is not the same as shipping it; there was no verification step between the two.
- **Bugs masked bugs (incident #4)**: Bugs #1–#3 all prevented the watcher from ever firing, which meant `dispatchStep(2)` was never reached and Bug #4's wrong option key never surfaced. Each "fix" exposed the next dormant defect rather than restoring auto-chaining. This is the Phase 4.5 architectural-signal from `systematic-debugging`: when each fix reveals a new problem in a different place, question the architecture, not just the symptom. The cluster of latent bugs here suggests the auto-chaining path is under-tested end-to-end (we test the regex but not the dispatch loop, not the API call shape, not the un-awaited rejection behavior).
- **Fire-and-forget API calls swallow errors**: `pi.sendUserMessage(...)` returns a `Promise<void>` but the runner does not `await` it. When the call rejected with `"Agent is already processing"`, the rejection vanished into a Node unhandled-rejection rather than being surfaced to the runner, the UI, or the session log. Bug #4 had been latent since 2026-05-22; awaiting the call would have made it loud on day one.
- **Structural typing hid the option-name regression**: TypeScript's `options?: { deliverAs?: "steer" | "followUp" }` accepts any extra keys at the call site. `{ streamingBehavior: "followUp" }` typechecks even though it does nothing. The compiler offered zero protection against the rename regression introduced in commit `b8dc870a`.
- **Extension hot-reload is not real**: when source on disk is updated, the running pi-coding-agent session keeps using the in-memory copy loaded at session start. After each "fix" we did not consistently restart the session before the next run, which made the debugging cycle longer than necessary.

### Where we got lucky
- Step 1 is the *only* JSON primary artifact. If other steps used JSON, the chain would have broken again later (from Bug #1).
- Bug #2 was discovered because Bug #1 masked it: when the marker was in a separate completion.md file, we attributed failure to the format gap. After fixing the format gap, the still-failing watcher exposed the regex bug.
- The agent created `completion.md` rather than silently omitting the marker or corrupting the JSON — making the Bug #1 failure mode easy to diagnose.
- Bug #3 was caught on the very next run after the postmortem was written, while context was still fresh. If the next pipeline invocation had been days later (or had happened to use an already-cached run ID with `\w`-class characters), reconciling the discrepancy between "postmortem says done" and "code says broken" would have been considerably harder.
- Bug #4 was exposed by Bug #2's fix landing — i.e. the very next pipeline invocation after the regex finally worked. If Bug #2 had been masked further (e.g. by a different artifact path or a different marker format), Bug #4 could have stayed latent for weeks. The pi-coding-agent session log preserves enough state-transition events (`pipeline-state` custom entries) to *prove* the watcher fired even though no user message followed — without that record, "step 2 never dispatched" would have been guesswork. The custom-entry persistence carried the diagnosis.
- The runner only had two `sendUserMessage` call sites. A larger surface with the same wrong key would have made Bug #4 substantially harder to clean up than a two-line patch.

## Timeline

| Time (UTC) | Event |
|---|---|
| 06:53:19 | **Run 065319Z**: Pipeline invoked |
| 06:53 | Step 1 dispatched |
| 06:54 | Agent completes step 1, writes marker to `completion.md` (not `run-metadata.json`) — Bug #1 |
| 06:54+ | Watcher polls `run-metadata.json` — no marker. Chain dead |
| 06:59 | Pipeline completes manually (all 8 steps via user prompting) |
| 07:00–07:05 | Phase 1 investigation: root cause of Bug #1 identified (missing JSON instruction) |
| 07:05–07:10 | Phase 1 fix: JSON format added to marker instruction (line 406) |
| 07:10 | Test suite (9 cases) written and passing |
| ~08:02 | **Run 080248Z**: Pipeline invoked with Phase 1 fix deployed |
| 08:03 | Agent completes step 1, writes `_stepComplete` key into `run-metadata.json` ✓ |
| 08:03+ | Watcher polls `run-metadata.json` — regex can't match digits. Chain still dead — Bug #2 |
| ~08:05 | User reports pipeline still not auto-progressing after fix |
| 08:05–08:10 | Phase 2 investigation: regex escaping bug identified (line 147 `\w` → just `w`) |
| 08:10 | Phase 2 fix **documented in this postmortem** (Status, Resolution, Action Item #2 marked done) — **but the source edit at line 147 was never staged or committed** |
| 08:14:27 | **Run 081427Z**: Pipeline invoked believing both fixes were deployed |
| 08:15 | Agent completes step 1, writes `_stepComplete` key into `run-metadata.json` ✓ |
| 08:15+ | Watcher polls — same broken regex still on line 147. Chain dead, third run in a row — Bug #3 |
| ~08:20 | User reports pipeline still stopping after step 1 and invokes `/systematic-debugging` |
| 08:20–08:26 | Investigation finds `git diff HEAD` empty, line 147 still `[\w-]`. Confirms postmortem-documented Phase 2 fix never landed in source |
| 08:26 | Phase 2 source edit **actually applied** in commit `2563fd6`: `\w` → `\\w` on line 147. Tests still pass 9/9; Node repro against `081427Z` artifact tail confirms watcher would now fire |
| 08:26–08:30 | Commit `2563fd6` + merge commit `872263a` land on `main` |
| 08:30:28 | New pi-coding-agent session starts |
| 08:30:40 | **Run 083040Z**: Pipeline invoked via `/pipeline-run automation-in-testing FLOW_ID=public-home` |
| 08:30:40–08:31:33 | Agent completes step 1: writes `run-metadata.json`, `flow-inventory.json`, `resolved-test-data.json`, with `_stepComplete` markers ✓ |
| 08:31:33.308 | `CompletionWatcher` fires: `pipeline-state` persisted with `stepMarkerReceived: true` then immediately again with `currentStep: 2, stepMarkerReceived: false` ✓ |
| 08:31:33.308 | `dispatchStep(2)` calls `pi.sendUserMessage(msg, { streamingBehavior: "followUp" })`. Wrong key → `deliverAs` undefined → agent still streaming → `prompt()` throws "Agent is already processing" → unhandled Promise rejection → message dropped silently — **Bug #4** |
| 08:31:33–08:31:53 | Agent continues finishing its step 1 turn (verifying markers in artifacts), then goes idle. No step 2 dispatch ever reaches the session log |
| ~08:45 | User reports "the fix does not work" with run ID `2026-05-30T083040Z` |
| 08:45–08:55 | Investigation: pi session log shows watcher fired and state advanced; cross-reference against `@earendil-works/pi-coding-agent@0.78.0/dist/core/agent-session.js:1037` confirms `sendUserMessage` reads `options.deliverAs`. `git blame` shows commit `b8dc870a` reverted both call sites from `deliverAs` to `streamingBehavior` |
| ~08:55 | Phase 3 fix applied (commit `6908c35`): `streamingBehavior` → `deliverAs` on lines 414 and 536. Merge commit `5fc4f79` lands on main. Marker-regex tests continue to pass 9/9 |

## Supporting Information

- **Affected runs**:
  - `results/automation-in-testing/flows/public-home/2026-05-30T065319Z/` (Bug #1)
  - `results/automation-in-testing/flows/public-home/2026-05-30T080248Z/` (Bug #2)
  - `results/automation-in-testing/flows/public-home/2026-05-30T081427Z/` (Bug #3 — Phase 2 fix documented but not applied; same failure mode as Bug #2)
  - `results/automation-in-testing/flows/public-home/2026-05-30T083040Z/` (Bug #4 — regex finally fixed but `sendUserMessage` option name regressed)
- **Pipeline branches**:
  - `pipeline/automation-in-testing/public-home/2026-05-30T065319Z`
  - `pipeline/automation-in-testing/public-home/2026-05-30T080248Z`
  - `pipeline/automation-in-testing/public-home/2026-05-30T081427Z`
  - `pipeline/automation-in-testing/public-home/2026-05-30T083040Z`
- **Relevant commits**:
  - `ccacaf8` — Phase 1: JSON marker instruction
  - `2563fd6` — Phase 2: regex escaping fix (the source edit that the postmortem had claimed)
  - `872263a` — Phase 2 merge into `main`
  - `6908c35` — Phase 3: `deliverAs` rename (Bug #4)
  - `5fc4f79` — Phase 3 merge into `main`
  - `b8dc870a` — **regression source** for Bug #4 (Phase 2 core refactor, 2026-05-22)
  - `4532e9b` — the prior correct rename (`streamingBehavior` → `deliverAs`) that was later reverted by `b8dc870a`
- **Extension file**: `.pi/extensions/pipeline-runner/index.ts`
  - Phase 1 fix: line 406 (marker instruction — JSON format added)
  - Phase 2 fix: line 147 (watcher regex — `\w` → `\\w`)
  - Phase 3 fix: lines 414 and 536 (`sendUserMessage` option — `streamingBehavior` → `deliverAs`)
- **Upstream API reference** (consulted during incident #4 investigation):
  - `@earendil-works/pi-coding-agent@0.78.0`
  - `dist/core/extensions/types.d.ts` — `sendUserMessage(content, options?: { deliverAs?: "steer" | "followUp" })`
  - `dist/core/agent-session.js:1012–1041` — implementation reads `options?.deliverAs`
  - `dist/core/agent-session.js:737–738` — throws "Agent is already processing" when streaming and no behavior specified
- **Test file**: `.pi/extensions/pipeline-runner/marker-regex.test.ts`
- **Watcher regex**: 
  - **Before fix**: `@step-complete step=${step} runId=([\w-]+T[\w:]+Z?)` — template literal reduces to `[w-]+T[w:]+Z?` (broken)
  - **After fix**: `@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)` — template literal preserves `[\w-]+T[\w:]+Z?` (correct)
- **Completion marker contract**: `workflows/manifest.yaml` → `completion_marker.regex`
- **Related ADR**: `docs/adr/0018-completion-marker-over-agent-end-chaining.md`
- **Prior diagnosis**: `docs/pipeline-runner-chaining/pipeline-runner-chaining-diagnosis.md`
- **Design decisions**: `docs/pipeline-runner-chaining/pipeline-runner-explicit-completion-signaling.md`

### Template-literal escaping detail

```
Template          JS evaluates to     Regex produced     Matches digits?
─────────────────────────────────────────────────────────────────────────
\w                w                   [w-] only          ❌ No
\\w               \w                  [\w-] (digit/word) ✅ Yes
```

In JavaScript template literals, `\w` is treated as an escape sequence for the *string* (not
the regex). The backslash is consumed, leaving just `w`. To pass a literal backslash-w to the
regex engine, you must write `\\w` in the template literal.
