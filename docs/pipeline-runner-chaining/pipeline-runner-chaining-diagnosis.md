# Diagnosis: Fragility of the Pipeline-Runner Chaining Mechanism

## Context and Symptoms

The pipeline-runner extension implements an 8-step E2E test generation workflow. Non-gated steps (1–3 and 6–8) are intended to chain automatically after each step completes. Gated steps (4 and 5) pause for human approval via `/pipeline-continue`.

In practice, the following error frequently occurs when a pipeline step finishes:

```
Extension "<runtime>" error: Agent is already processing. Specify streamingBehavior ('steer' or 'followUp') to queue the message.
```

This error appears specifically after a finished pipeline step (during auto-advance) and can leak into normal pi interactions when pipeline state or pending flags persist.

## Current Chaining Design

The mechanism relies on the following elements in `.pi/extensions/pipeline-runner/index.ts`:

- Module-level mutable state: `pipeline`, `pendingPipelineStep`, and `pendingGateApproval`.
- `pi.on("agent_end", ...)` handler that inspects these flags to decide whether to dispatch the next step.
- `dispatchStep(step, ctx?)` which calls `pi.sendUserMessage(...)` to inject the next `/pipeline-xxx` command.
- A 300 ms `setTimeout` yield before dispatching the next step.
- Special handling in `pipeline-continue` that sends the string `"approved"` to trigger promotion of gated artifacts.

The design assumes that each step completion produces a clean `agent_end` event from which the extension can safely schedule the subsequent step.

## Root Cause Analysis

### Primary Fragility: Runtime Processing State vs. Event Timing

The pi runtime maintains an internal "processing" flag that is not immediately cleared when an `agent_end` event is emitted. When `dispatchStep` executes (even after the 300 ms yield), the call to `sendUserMessage` without the correct streaming option violates the runtime contract, producing the observed error.

Attempts to guard the send with `ctx.isIdle()` proved unreliable because:

- The `isIdle()` check at the moment of the handler does not always reflect the runtime's internal state.
- The yield window is insufficient for complex steps (e.g., `pipeline-discover`, `pipeline-run-fix`).

### Secondary Issues

1. **Module-Level Mutable State**
   - `pendingPipelineStep` and `pendingGateApproval` are never reliably cleared on normal (non-pipeline) turns.
   - A restored or stale `pipeline` object causes the `agent_end` handler to execute dispatch logic on every subsequent agent turn.

2. **Global Event Handler**
   - Registering a heavy `agent_end` listener that performs state checks and potential message sends on *every* turn pollutes the normal pi session when pipeline state lingers.

3. **Lack of Explicit Completion Signaling**
   - The design depends on the *absence* of further internal turns within a step. Complex steps that perform multiple tool calls or LLM reasoning cycles violate this assumption.

4. **Inconsistent Option Usage**
   - Early versions used no option, then `deliverAs`, then `streamingBehavior`. The runtime error message itself indicates that `streamingBehavior` is the expected key, yet even correct usage did not fully eliminate races from within `agent_end`.

## Architectural Problems

**This issue is specific to the pi agent runtime and extension model.** The current approach violates a key assumption of the pi extension model:

- `agent_end` is not a safe point from which to unconditionally schedule new user messages without either (a) explicit runtime support for post-turn queuing or (b) the step itself signaling completion.

The combination of:
- Implicit turn completion detection,
- Mutable global state, and
- Direct `sendUserMessage` calls inside an event handler

creates a timing-dependent system that is inherently fragile under realistic step execution patterns.

## Implications

Any future redesign should move away from "detect completion then push next message" toward one of the following patterns:

- Have each pipeline step emit an explicit completion marker (e.g., a custom event or a well-known string in the final assistant message) that the extension can react to.
- Use a dedicated queue or scheduler that the runtime processes safely between turns.
- Reduce reliance on `agent_end` for orchestration and instead drive the pipeline through a more controlled command or tool interface.

This diagnosis explains why repeated small patches (idle checks, forced `streamingBehavior`, pending clears, yield increases) have not produced a stable solution. The problem is structural rather than a single missing guard or option.