# opencode Adapter

Maps the 8-step `workflows/manifest.yaml` pipeline to opencode tool-based execution.

## Pipeline Steps

Run each step in order within an opencode session. Each step uses opencode's native tools (Read, Write, Bash, Glob, Grep, agent-browser) to execute the pipeline.

| Order | Step | Gated | Tools Used |
|-------|------|-------|------------|
| 1 | resolve | No | Read, Write, Bash (git) |
| 2 | discover | No | Read, agent-browser, Write |
| 3 | extract-selectors | No | Read, Write |
| 4 | draft-page-object | **Yes** | Read, Write |
| 5 | draft-tests | **Yes** | Read, Write |
| 6 | write-spec | No | Read, Write, Bash (typecheck) |
| 7 | run-fix | No | Bash (playwright, ffmpeg), Read, Write, Edit |
| 8 | summarize | No | Read, Write |

## Placeholder Resolution

The opencode agent resolves these placeholders from context:

- `{{app}}` — the app slug (e.g., `automation-in-testing`), matching `apps/<app>/profile.yaml`
- `{{run}}` — the ISO 8601 run ID generated in step 1 (e.g., `2026-06-03T143000Z`)
- `{{baseUrlEnvVar}}` — the environment variable name from the app profile
- `{{flowId}}` — required single flow ID for the run

## Gated Steps (4 and 5)

Steps 4 (draft page object) and 5 (draft tests) require human approval. The pipeline **hard-stops** at these steps using structured sub-steps:

**Sub-step structure for each gated step:**
1. **Write draft** — always writes a fresh draft to the run-specific results directory
2. **STOP** — outputs a review message and halts. No files are written after this point.
3. **Promote on approval** — only after the human replies with `approved`, `approve`, `continue`, or `lgtm`

**Approval markers:** After promotion, gated steps write a `.approved` file to the run results directory (e.g., `results/.../step4-draft-page-object/.approved`). Steps after gates check for this marker — NOT the promoted artifact location. This prevents the agent from skipping gates when promoted artifacts already exist from prior runs.

| Step | Gate | Promoted Artifact | Prerequisite Check |
|------|------|-------------------|--------------------|
| 4 | **Yes** | `src/pages/{{app}}/{{app}}.page.ts` | — |
| 5 | **Yes** | `tests/{{app}}/{{flowId}}.feature` | Step 4 `.approved` marker |
| 6 | No | `tests/{{app}}/{{flowId}}.spec.ts` | Step 5 `.approved` marker |
| 7 | No | test results | Spec file exists |

**Why markers instead of file existence:** Prior runs leave promoted artifacts on disk. The agent cannot distinguish "approved in a prior run" from "not yet approved in THIS run." The `.approved` marker is scoped to the run ID, making approval state unambiguous.

## Running a Flow

To run the full pipeline, tell opencode:

```
Run the pipeline for automation-in-testing, flow public-home
```

opencode will:
1. Generate a run ID (ISO 8601 timestamp)
2. Execute steps 1–3 sequentially
3. **Stop at step 4** — present draft page object, await your approval
4. After approval, execute step 5 and **stop again** — present draft tests, await your approval
5. After second approval, execute steps 6–8 to completion

To run a single step:

```
Execute the resolve step from adapters/opencode/capabilities.yaml for app=automation-in-testing, flowId=public-home
```

## Running Tests Locally

After step 6 (write-spec), run tests locally:

```bash
APP_NAME=automation-in-testing FLOW_ID=public-home npx playwright test tests/automation-in-testing/public-home.spec.ts
```

Or run all tests for an app:

```bash
APP_NAME=automation-in-testing npx playwright test tests/automation-in-testing/
```

## Adding a Second Adapter

To add a different AI agent, create a new file at `adapters/<agent>/capabilities.yaml` with the same structure. No changes to `workflows/manifest.yaml` are needed.

Each capability must:
- Reference a valid manifest step `id` in its `step` field.
- Provide a `command_template` with `{{app}}`, `{{run}}`, and `{{flowId}}` placeholders.
- Mark `gated: true` if the corresponding manifest step is gated (steps 4 and 5).

The adapter schema is defined in `contracts/adapter.schema.yaml`.

## Key Differences from pi Adapter

| Aspect | pi | opencode |
|--------|-----|----------|
| Execution model | Slash commands (`/pipeline-resolve`) | Tool calls (Read, Write, Bash) |
| Browser interaction | Agent CLI built-in | agent-browser skill |
| File operations | Agent-managed | Direct Read/Write/Edit tools |
| Test execution | Agent-managed | Bash (`npx playwright test`) |
| Type checking | Agent-managed | Bash (`npm run typecheck`) |
