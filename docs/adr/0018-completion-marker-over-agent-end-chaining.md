# Completion Marker over agent_end Chaining

Status: accepted

Pipeline Runner step chaining will use explicit Completion Markers on Artifact files, detected by a filesystem-polling CompletionWatcher, instead of the `agent_end` event-driven dispatch with mutable module-level flags.

## Considered Options

- Keep `agent_end` event handler with `pendingPipelineStep`/`pendingGateApproval` flags: proven fragile under realistic step complexity, produces "Agent is already processing" errors due to timing mismatch between `agent_end` emission and runtime internal state.
- Use explicit Completion Marker on Artifacts with filesystem-polling watcher: decouples detection from runtime event timing, eliminates race conditions, adds a polling loop as operational overhead.
- Use a runtime-provided post-turn queue: not available in the pi extension API.

## Decision

Adopt Completion Markers with filesystem polling. The marker lives as a structured footer on each step's primary Artifact (`@step-complete step=N runId=...`). A CompletionWatcher module polls the known artifact path at 500ms intervals. When the marker is detected, it fires `onStepComplete(step, context)`. The Pipeline Runner consumes this event to advance to the next step or pause at gates.

The legacy `agent_end` handler — including `pendingPipelineStep`, `pendingGateApproval`, the 300ms `setTimeout` yield, and the idle-guard — is removed entirely in the same change.

## Consequences

- Chaining is now race-free: the marker proves the step genuinely completed, and the poll fires long after runtime state has settled.
- A polling interval runs while a pipeline is active. No polling when no pipeline is running.
- The marker contract is declared once in `workflows/manifest.yaml` and injected into each step prompt programmatically by the Runner.
- `/pipeline-continue` no longer waits for agent-side promotion — it sends `"approved"` and immediately advances to the next step.
- Session restore checks artifact existence: if the artifact for the in-progress step doesn't exist, the pipeline resets.
- Tests use synthetic artifact files and direct `onStepComplete` injection for the Runner; temp directories for the watcher.
