# PRD: Pipeline Agent for opencode

## Problem Statement

The 8-step E2E test generation pipeline is defined in `workflows/manifest.yaml` and `adapters/opencode/capabilities.yaml`, but there is no dedicated opencode agent to orchestrate it. Users must manually instruct the build agent to follow the pipeline steps, provide gating awareness, create branches, and manage state. This is error-prone — the build agent has no built-in knowledge of the pipeline sequence, gating rules, or approval protocol, and may skip gates, lose context, or fail to chain steps.

## Solution

A new `pipeline` opencode agent that serves as a first-class orchestrator for the 8-step E2E pipeline. It reads `adapters/opencode/capabilities.yaml` at runtime for step-specific instructions, auto-chains non-gated steps, hard-stops at gated steps (4 and 5) for human approval, creates isolated git branches per run, and detects existing artifacts for resumption. Invocable via `/pipeline <app> <flowId>` or by switching to the pipeline agent.

## User Stories

1. As a test engineer, I want to switch to a dedicated pipeline agent, so that I can run the E2E pipeline in a workflow mode separate from general coding tasks
2. As a test engineer, I want to invoke `/pipeline <app> <flowId>`, so that I can start the full pipeline with a single command
3. As a test engineer, I want the pipeline to auto-chain non-gated steps (1-3 and 6-8), so that I don't have to manually advance between steps that don't require review
4. As a test engineer, I want the pipeline to hard-stop after step 4 (draft page object), so that I can review the generated TypeScript page object before it's promoted
5. As a test engineer, I want the pipeline to hard-stop after step 5 (draft tests), so that I can review the generated Gherkin scenarios before they're promoted
6. As a test engineer, I want to approve a draft by saying "approved", "approve", "continue", or "lgtm", so that the pipeline resumes from the gated step
7. As a test engineer, I want the pipeline to create a git branch `pipeline/<app>/<flowId>/<runId>`, so that pipeline artifacts are isolated from my working branch
8. As a test engineer, I want the pipeline to detect existing run artifacts when I provide an app and flow, so that I can resume an interrupted pipeline rather than starting over
9. As a test engineer, I want the pipeline agent to read step definitions from `adapters/opencode/capabilities.yaml`, so that step instructions are maintained in a single source of truth
10. As a test engineer, I want the pipeline agent to resolve `{{app}}`, `{{run}}`, `{{flowId}}`, and `{{baseUrlEnvVar}}` placeholders, so that each step executes with the correct runtime context
11. As a test engineer, I want the pipeline agent to validate that prerequisite `.approved` markers exist before executing steps 6 and 7, so that gates cannot be skipped
12. As a test engineer, I want the pipeline agent to generate an ISO 8601 run ID at step 1, so that each run has a unique, timestamped identifier
13. As a test engineer, I want the pipeline agent to appear in the agent list alongside build and plan, so that I can discover and switch to it naturally
14. As a test engineer, I want the pipeline agent to use the default model, so that it inherits whatever model I've configured globally
15. As a test engineer, I want the pipeline agent to read the app profile and flow file at step 1, so that it validates inputs before executing expensive browser steps
16. As a test engineer, I want the pipeline agent to use the agent-browser skill for step 2 (discover), so that it can navigate the app and capture ARIA snapshots
17. As a test engineer, I want the pipeline agent to run `npm run typecheck` after generating the Playwright spec, so that type errors are caught before test execution
18. As a test engineer, I want the pipeline agent to classify test failures as script bugs or app bugs, so that only automation code is fixed, not application defects
19. As a test engineer, I want the pipeline agent to update knowledge files after a run, so that future runs benefit from verified observations
20. As a test engineer, I want the pipeline agent to report progress after each step, so that I can track which step is executing and what artifacts were produced
21. As a test engineer, I want the pipeline agent to handle the case where an app or flow doesn't exist, so that I get a clear error rather than a cryptic failure
22. As a test engineer, I want the pipeline agent to handle the case where `.env` is missing the required base URL variable, so that step 1 fails fast with a useful message

## Implementation Decisions

**1. Agent-as-file architecture**
The pipeline agent is defined as a Markdown file at `.opencode/agents/pipeline.md` with YAML frontmatter. The file body is the system prompt. No runtime code changes — the agent is pure prompt engineering plus opencode configuration.

**2. Orchestration-over-inline design**
The agent's system prompt encodes orchestration logic (sequence, gating, state, branching) but delegates step-specific instructions to `adapters/opencode/capabilities.yaml`, read at runtime. This avoids duplicating the 190-line capabilities file in the prompt and ensures a single source of truth.

**3. Conversational gating protocol**
Gated steps (4 and 5) use a three-phase protocol encoded in capabilities.yaml command templates: (a) write draft, (b) output STOP message and halt, (c) promote on approval. The agent's system prompt reinforces this behavior to prevent the model from skipping ahead.

**4. Auto-chaining for non-gated steps**
Steps 1-3 and 6-8 execute sequentially without pausing. The agent transitions directly from one step's completion to the next step's dispatch. This matches the pi pipeline runner's behavior.

**5. Branch isolation per run**
Each pipeline run creates a git branch named `pipeline/<app>/<flowId>/<runId>` at step 1. All artifacts are produced on this branch. The user can discard a failed run by deleting the branch.

**6. Filesystem-based state detection**
On invocation, the agent checks `results/<app>/flows/<flowId>/` for existing run directories. If found, it offers to resume from the last incomplete step rather than starting a new run. State is determined by which step directories contain their expected output artifacts and `.approved` markers.

**7. Command entry with agent routing**
The `/pipeline` command in opencode.json uses the `agent` field to route to the pipeline agent automatically. The command template passes `{{arg1}}` (app) and `{{arg2}}` (flowId) as arguments.

**8. opencode.json minimal footprint**
The config file registers only the agent and command. No permissions overrides, no model overrides, no MCP servers. The agent inherits build's default permissions and the global model.

**9. Agent prompt structure**
The system prompt is organized into sections: Role, Startup, Pipeline Sequence, Gating Rules, Approval Protocol, Branch Management, State Detection, Placeholder Resolution, Step Execution, Error Handling. Each section is concise and actionable.

**10. Validation at step boundaries**
The agent validates prerequisites at each step boundary: app profile exists, flow file exists and matches schema, `.env` has the required variable, `.approved` markers exist for post-gate steps. Validation failures produce clear error messages and halt the pipeline.

## Testing Decisions

**What makes a good test:** Structural validation of configuration artifacts — ensuring the agent file has correct frontmatter, the prompt covers all required sections, and opencode.json validates against the schema. Since this is a prompt-and-config feature, behavioral testing requires running opencode itself (out of scope for automated tests).

**Module 1 — Pipeline Agent Definition:**
- Validate frontmatter has required fields (`description`, `mode: primary`)
- Validate the prompt references `adapters/opencode/capabilities.yaml`
- Validate the prompt covers all 8 pipeline steps by name
- Validate the prompt mentions gated steps (4 and 5) and the approval protocol
- Validate the prompt mentions branch creation pattern `pipeline/<app>/<flowId>/<runId>`

**Module 2 — opencode Configuration:**
- Validate `opencode.json` against `https://opencode.ai/config.json` schema
- Validate the `command.pipeline` entry has required fields (`template`, `agent`)
- Validate the `agent.pipeline` entry has correct `mode: primary`
- Validate the `agent` field in the command references the registered agent name

**Prior art:** No existing tests in the codebase for configuration validation. These would be the first. Suggested approach: a simple Node.js script using `ajv` for JSON schema validation and regex checks for the agent file structure.

## Out of Scope

- **Pipeline runner extension for opencode:** The pi adapter has a `CompletionWatcher` and state machine in `.pi/extensions/pipeline-runner/index.ts`. This PRD does NOT port that extension to opencode. The agent handles orchestration via its prompt, not via code.
- **Multi-flow pipeline runs:** Running multiple flows in a single invocation. Each run targets exactly one flow.
- **Custom step ordering or skipping:** The agent always runs steps 1-8 in order. No partial pipeline execution via the command (though the user can manually ask the agent to run individual steps).
- **Permission tightening:** The agent inherits build's defaults. Fine-grained permission configuration is deferred.
- **Persistent pipeline state across sessions:** If the user closes opencode mid-pipeline, state is recovered by filesystem detection on next invocation, not by persisted state files.
- **Changes to `adapters/opencode/capabilities.yaml` or `workflows/manifest.yaml`:** These files are read, not modified.

## Further Notes

- The agent prompt should be written to handle conversation compaction gracefully — if context is compacted, the agent re-reads capabilities.yaml and checks filesystem state to determine where it left off.
- The `/pipeline` command's template should instruct the agent to start from step 1 by default, with resumption as an opt-in behavior when existing artifacts are detected.
- Future enhancement: a `/pipeline-status` command that shows current pipeline progress without executing steps.
