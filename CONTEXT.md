# CONTEXT.md — Playwright AI Workflow Playground

Domain glossary. No implementation details.

## Language

### Pipeline
A sequence of 8 steps (resolve → discover → extract-selectors → draft-page-object → draft-tests → write-spec → run-fix → summarize) that takes an app's flow intent and produces a working Playwright spec + test results + knowledge updates. Each step is driven by a pi slash command defined in `adapters/pi/capabilities.yaml`.

### App
A target system-under-test. Defined by a `profile.yaml` with a `name` slug, a `baseUrlEnvVar` (env var holding the base URL), and optional metadata. Apps live under `apps/<name>/`.

### Flow
A single named user journey through an app. Defined as a YAML intent file under `apps/<app>/flows/<flow-id>.yaml`. One pipeline run targets exactly one flow.

### Run
A single execution of the full pipeline for one app + flow. Each run produces a timestamped directory under `results/<app>/flows/<flow-id>/<run>/` containing all pipeline artifacts. A run ID is an ISO 8601 timestamp.

### Artifact
Any file produced by a pipeline step. Includes ARIA snapshots (YAML), selector candidates (Markdown), page object drafts (TypeScript), Gherkin feature files, Playwright specs (TypeScript), test reports, screenshots, traces, and knowledge file entries. All artifacts are text-based (YAML, Markdown, TypeScript).

### Approval Gate
A manual human-in-the-loop review point. After steps 4 (page object draft) and 5 (test draft), the human reviews the artifact in chat and types "approved" before the pipeline continues. Each promoted artifact carries a provenance header (run ID + approval timestamp + approving step).

### Runner
The execution environment for browser-dependent pipeline steps. Two modes exist:
- **native** — Playwright uses locally installed browsers via `npx playwright test` or `npx playwright-cli`. No containerization. Default for all apps unless overridden.
- **docker** — Playwright executes inside an ephemeral `mcr.microsoft.com/playwright` container. The project root is bind-mounted so source code and dependencies are available, and `results/` is written back to the host. The image tag is pinned in `.docker-version` at the project root.

### Knowledge Files
Per-app Markdown files under `knowledge/<app>/` that accumulate observations across runs. `knowledge.md` holds domain facts, `rules.md` holds verified locator/project rules, `selector-notes.md` holds selector-specific findings. Populated by step 8 (summarize) as append-only entries under `## Run <run-id>` headings.

### Capability
A neutral, app-and-agent-independent definition of WHAT a pipeline step does. Defined in `workflows/manifest.yaml`. Each adapter (e.g., `adapters/pi/capabilities.yaml`) maps capabilities to agent-specific command templates (HOW to execute).

### Agent CLI
The Playwright Agent CLI (`@playwright/cli`). A token-efficient command-line browser automation tool designed for coding agents. Provides daemon-based persistent browser sessions with accessibility snapshots and element refs. Used for step 2 (discover) on docker-runner apps, invoked inside the Docker container.

## Relationships

- An **App** has one or more **Flows**.
- A **Run** targets exactly one **Flow** of one **App**.
- A **Pipeline** produces **Artifacts** across 8 steps, some gated by **Approval Gates**.
- A **Runner** (native or docker) determines how browser steps execute. Per-app, set in the app **Profile**.
- **Knowledge Files** accumulate observations from multiple **Runs**.
- A **Capability** is implemented by one **Adapter** per agent.

## Example dialogue

"The `automation-in-testing` app uses the `docker` runner because it targets a remote public website and we want reproducible browser versions without depending on host-installed browsers. The `example` app uses `native` because it's a local static HTML page served on the host for quickstart and development. Both share the same pipeline, capability definitions, and artifact structure."
