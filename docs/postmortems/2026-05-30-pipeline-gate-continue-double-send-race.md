# Pipeline Gate Stall — `/pipeline-continue` Fires Two Racing User Messages, Second Is Dropped (incident #2026-05-30-004)

### Date
2026-05-30, run `2026-05-30T132439Z` (flow `policy-links`), investigated same day

### Authors
- @ryga (reporter)
- systematic-debugging session (investigator)

### Status
Resolved in source (fix applied to `.pi/extensions/pipeline-runner/index.ts`; new
`gate-continue-single-dispatch.test.ts` 6/6; `marker-regex.test.ts` 11/11;
`artifact-path.test.ts` 9/9; `tsc --noEmit` clean).
**Runtime confirmation pending**: the extension does not hot-reload — verifying gate-4 → step-5
auto-advance requires a pi-coding-agent session restart and a fresh pipeline run.

This is **NOT** the same root-cause class as incidents #1, #2/#5, and #6
(`…-completion-marker-json.md`, `…-step2-marker-wrong-file.md`,
`…-step6-write-spec-wrong-primary-artifact.md`). Those are all *"the file the CompletionWatcher
polls is not the file the agent writes the marker into"* — a deterministic, watcher-never-fires
stall. This incident is a **message-delivery race in the gate-approval path**: the next step is
never dispatched to the agent at all, so there is no artifact and no marker to watch. It looks
like "the gate hung again," but the mechanism is unrelated to the marker/watcher subsystem.

### Summary

On run `2026-05-30T132439Z` the pipeline auto-chained cleanly through steps 1–4 (every marker
landed in its watched file — the incident-#5 fix working) and paused correctly at the step-4
page-object-review gate. The user ran `/pipeline-continue`. The agent processed the `"approved"`
message — it promoted the page-object draft into the shared page object (added the provenance
line) — and then **stopped**. Step 5 (`pipeline-draft-tests`) never ran: no `step5-draft-tests/`
directory was ever created. The user observed: *"after I approve gated step 4, agent stop again."*

**Root cause:** `/pipeline-continue` issued **two** `pi.sendUserMessage(...)` calls in the same
synchronous tick — `"approved"` (to trigger draft promotion) and then the next-step dispatch via
`dispatchStep()`. The first send starts an agent turn; the second send races the agent's
transition into the "processing" state. When it loses the race it hits the **exact mechanism
documented in incident #1 Bug #4**: the runtime's `prompt()` throws *"Agent is already
processing,"* and because `sendUserMessage` is **not awaited**, the rejection is unhandled and the
next-step message is **silently dropped on the floor**. The agent finishes the `"approved"` turn,
goes idle, and the step-5 watcher polls a file that is never created → indefinite stall.

Because this is a race, it is **intermittent** — the dispositive signal. The *identical* code
advanced the gate on run `2026-05-30T120453Z` (step-5 artifacts were created ~8 min after the
step-4 draft) and dropped step 5 on run `2026-05-30T132439Z`. A deterministic watched-file
mismatch (incidents #1/#5/#6) fails *every* time; this fails *sometimes*.

**Why only the gate path:** every other transition issues exactly **one** message to a reliably
**idle** agent — `pipeline-run` start (one send), and non-gated auto-chain
(`onStepComplete → dispatchStep`, one send fired from the watcher callback *after* the agent has
gone idle). `/pipeline-continue` was the **only** path that fired two `sendUserMessage` calls
back-to-back, and the only one whose second send targets an agent that may already be busy with
the first. That structural asymmetry is the bug.

### Impact

| Dimension | Details |
|---|---|
| **Pipelines affected** | Intermittent on any gated run. Observed stall: `automation-in-testing/policy-links/2026-05-30T132439Z` (gate 4). Latent on `…/public-home/120453Z` (won the race, advanced). |
| **Where it stalls** | The gate→next-step transition (step 4→5 and step 5→6), whenever the second send loses the race. |
| **Duration impact** | Pipeline halts at the gate; the next step must be driven manually. |
| **Artifact correctness** | All produced content correct; only orchestration broke. |
| **User experience** | Agent promotes the draft, then goes idle as if "done." User must detect and report the stall. |
| **Data loss** | None. |
| **Other flows/apps** | General: affects every gated step on every flow/app, non-deterministically. |

### Root Cause

#### The two-send race in `/pipeline-continue`

1. `/pipeline-continue` (handler at `index.ts`) computed `nextDispatchStep`, then:
   - `pi.sendUserMessage("approved", { deliverAs: "followUp" })`  — **send #1** (promotion side-effect)
   - `dispatchStep(nextDispatchStep, ctx)` → `pi.sendUserMessage("/pipeline-… ", { deliverAs: "followUp" })` — **send #2**

   Both fire synchronously, one tick apart, with no `await` between them and no wait for send #1's
   turn to complete.

2. The pipeline is `paused_gate` when `/pipeline-continue` runs, so the agent is **idle**. Send #1
   starts a turn. Send #2 is issued before the runtime has necessarily registered the agent as
   "processing" — a classic check-then-act race on the runtime's busy state.

3. When send #2 loses the race, the runtime's `prompt()` throws *"Agent is already processing.
   Specify streamingBehavior ('steer' or 'followUp') to queue the message."* The call is not
   awaited (carried gap from incident #1 AI #11), so the rejection is swallowed and the next-step
   message is dropped. `deliverAs: "followUp"` was present on both calls and still did not save the
   case — the throw happens on the second concurrent *entry* to `prompt()`, before the followUp
   queue is consulted.

4. The result is indistinguishable from a gate hang: agent goes idle after promotion, the step-5
   watcher (correctly registered) polls a never-created file, and the chain is dead.

#### Causal chain

```
Run 132439Z: steps 1–4 auto-chain; every marker in its watched file ✓ (incident-#5 fix working)
gate 4 reached → status = paused_gate (correct)
user: /pipeline-continue
    send #1: "approved" (followUp) → agent starts a turn → promotes page-object draft (provenance line added)
    send #2: "/pipeline-draft-tests …" (followUp), same tick → loses race → "Agent is already processing"
             → un-awaited rejection swallowed → step-5 message dropped
    agent finishes "approved" turn → idle
    watcher(step 5) polls step5-draft-tests/test-drafts-index.md → never created → onStepComplete(5) never fires
    → pipeline stalls at gate 4→5
```

### Trigger
Any `/pipeline-continue` at a gate. Whether it stalls depends on the timing of the agent's
busy-state transition between the two synchronous sends — hence intermittent.

### Resolution

Chosen approach (per user decision): **fold the approval into the single next-step dispatch** so
the gate path issues exactly ONE message — the proven one-message-to-idle pattern that non-gated
auto-chaining already uses.

1. **`.pi/extensions/pipeline-runner/index.ts`**
   - `dispatchStep(step, ctx?, approvalPreamble?)` — new optional `approvalPreamble` prepended to
     the single dispatched message (so `"approved"` is the first thing the agent reads), before the
     step command, flow context, and completion-marker instruction.
   - `/pipeline-continue` no longer sends a separate `"approved"` message and no longer duplicates
     the state-update / watcher-registration block (which `dispatchStep` already owns). It builds an
     `approvalPreamble` (`"approved"` + "promote the approved draft … then continue with the next
     step — do not stop after promotion") and calls `dispatchStep(nextDispatchStep, ctx, preamble)`.
     One `sendUserMessage`, no race.

2. **`.pi/extensions/pipeline-runner/gate-continue-single-dispatch.test.ts`** (new) — the first test
   that drives the **dispatch loop** rather than the regex/path. Injects a `paused_gate` pipeline via
   the `session_start` restore path against a mock `pi`, invokes the `pipeline-continue` handler, and
   asserts:
   - gate 4 and gate 5 each issue **exactly one** `sendUserMessage` (was 2 — the bug),
   - that single message carries **both** the approval (`"approved"`) and the next step's command
     (`/pipeline-draft-tests`, `/pipeline-write-spec`),
   - it uses `deliverAs: "followUp"`.
   Failed 0/6 before the fix (reproduced the two sends deterministically: `["approved",
   "/pipeline-draft-tests …"]`), **6/6 after**.

`marker-regex.test.ts` 11/11 and `artifact-path.test.ts` 9/9 unchanged; `tsc --noEmit` clean.

**Verification still required (runtime):**
- Restart the pi-coding-agent session (extension does not hot-reload).
- Re-run a gated flow (e.g. `/pipeline-run automation-in-testing FLOW_ID=policy-links`), approve
  gates 4 and 5, and confirm each `/pipeline-continue` advances to the next step without manual
  prompting, repeatedly (it is a race — confirm across several runs, not one).

### Detection
- **How detected**: User observation — *"after I approve gated step 4, agent stop again."* User
  invoked `/systematic-debugging`.
- **What investigation found**: `find` showed steps 1–4 artifacts + markers all present and correct,
  but **no `step5-draft-tests/` directory** — step 5 was never dispatched, not merely
  marker-mismatched. Cross-checking run `120453Z` showed the same code *did* create step-5 artifacts,
  proving the failure is intermittent → a race, not a deterministic watched-file bug. Code structure
  confirmed `/pipeline-continue` is the only two-`sendUserMessage` path.
- **Alert mechanism**: None — same gap as all prior incidents. A stalled/idle agent emits no warning.

### Action Items

| # | Action | Priority | Owner | Status |
|---|---|---|---|---|
| 1 | Fold gate approval into a single `dispatchStep` message (one send, no race) | P0 | @ryga | ✅ Done (working tree) |
| 2 | Add `gate-continue-single-dispatch.test.ts` asserting the gate path issues exactly one send carrying approval + next-step command | P0 | @ryga | ✅ Done (6/6) |
| 3 | Commit the fix and verify at runtime after a session restart + several gated runs | P0 | @ryga | ⬜ Pending |
| 4 | **`await` every `pi.sendUserMessage`** so a dropped/rejected send surfaces instead of being swallowed (carried from incidents #1/#5 AI). This is the silence that let the race go undetected. | P1 | — | Backlog |
| 5 | **Watcher heartbeat/timeout warning** — if a step's watcher has not fired within N seconds of dispatch, emit a visible warning. Would have auto-detected this stall and #1/#2/#3/#5/#6. | P1 | — | Backlog |
| 6 | **End-to-end auto-chaining test** driving dispatch→watch→marker across all 8 steps *including both gates*. Item #2 covers the gate-send count; a full loop test is still missing. | P1 | — | Backlog |

### Lessons Learned

#### What went well
- The intermittency was recognized as a **race signature** early (deterministic bugs don't pass on
  one run and fail on the next with identical code), which immediately separated this from the
  watched-file class of incidents #1/#5/#6 and pointed at message delivery.
- Artifact-tree state (`no step5 dir`) gave a one-shot diagnosis: step 5 was never dispatched, not
  marker-mismatched — ruling out the entire marker/watcher subsystem without a session log.
- The new test reproduced the defect **deterministically** (the two sends are structural; only their
  *delivery* is racy), so the regression guard is solid even though the runtime symptom is flaky.

#### What went wrong
- **The gate path never matched the working transition pattern.** Non-gated chaining always sends
  one message to an idle agent; the gate path sent two from a single handler. The asymmetry was
  latent because send #2 usually won the race.
- **`sendUserMessage` rejections are still swallowed** (AI #4). Had send #2 been awaited, the dropped
  step-5 message would have surfaced as an error instead of a silent idle.
- **Coverage still didn't include the dispatch loop** until this incident — every prior postmortem
  flagged it; the gate-send count is the first piece of it to get a test.

#### Where we got lucky
- The promotion (send #1) always succeeded, so the page object was correctly promoted; only the
  forward chain broke. No bad artifact shipped.

### Supporting Information
- **Affected run**: `results/automation-in-testing/flows/policy-links/2026-05-30T132439Z/` (no `step5-draft-tests/`)
- **Latent-but-passed run**: `…/public-home/2026-05-30T120453Z/` (step-5 artifacts present — won the race)
- **Pipeline branch**: `pipeline/automation-in-testing/policy-links/2026-05-30T132439Z`
- **Extension file**: `.pi/extensions/pipeline-runner/index.ts`
  - Bug location: `pipeline-continue` handler — `sendUserMessage("approved", …)` followed by `dispatchStep(next)` (a second `sendUserMessage`)
  - Fix: `dispatchStep` gains `approvalPreamble`; `pipeline-continue` folds approval into one `dispatchStep` call
- **Test file**: `.pi/extensions/pipeline-runner/gate-continue-single-dispatch.test.ts` (new, 6 cases)
- **Mechanism precedent**: incident #1 Bug #4 (`…-completion-marker-json.md`) — "Agent is already processing", un-awaited rejection drops the message
