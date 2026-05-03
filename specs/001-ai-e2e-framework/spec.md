# Feature Specification: Playwright AI E2E Framework

**Feature Branch**: `001-ai-e2e-framework`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "Create a Playwright AI Workflow Playground framework — a generic TypeScript Playwright repository for experimenting with AI workflows and testing different web applications."

## Clarifications

### Session 2026-04-30

- Q: Should the framework include slash-command wrappers or only standalone prompt templates? → A: Slash-command wrappers only — pipeline steps are invoked as pi agent commands mirroring the intelli-park-e2e adapter pattern. No standalone `prompts/` directory. The commands live in `adapters/pi/capabilities.yaml` as `command_template` entries.
- Q: What are the required fields for a minimal app profile? → A: Only `name` and `baseUrlEnvVar` are required. Auth method, test tags, and storage state path are all optional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Framework Scaffold with Example App (Priority: P1)

A QA engineer clones the repository, installs dependencies, and immediately has a working TypeScript + Playwright project with a documented directory structure, a local example application page, and an app profile schema they can read to understand how to add their own applications.

**Why this priority**: Without the structural foundation (folders, config, npm scripts, type checking, .gitignore, .env.example), no other story can begin. The example app provides a concrete target for the pipeline without requiring any external service or credentials.

**Independent Test**: Run `npm install && npm run typecheck` and confirm zero errors. Serve the example app page locally and verify it renders interactive elements (form, table, navigation). Read the app profile schema and docs to understand how to add a new application.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the user runs `npm install`, **Then** all dependencies install without errors and `npm run typecheck` reports zero type errors.
2. **Given** the framework is installed, **When** the user serves the example app page locally, **Then** a page renders with form inputs, a data table, and navigation elements that Playwright can interact with.
3. **Given** the framework is installed, **When** the user reads `apps/example/profile.yaml` and the documentation, **Then** they understand the app profile schema (required: name + base URL env var; optional: auth method notes, test tags, storage state path) and can mentally map it to their own application.
4. **Given** the framework is installed, **When** the user inspects `.env.example`, **Then** they see all required environment variables documented with placeholder values and no real secrets committed.

---

### User Story 2 — Pipeline Workflow Architecture (Priority: P2)

A test architect examines the repository and finds a complete, readable workflow definition pipeline with neutral capability descriptions and agent-specific adapter commands. Pipeline steps are invoked as pi slash commands (mirroring the intelli-park-e2e pattern). They can trace how each step connects to the next and understand how to swap agents by adding a new adapter.

**Why this priority**: The pipeline is the framework's core value proposition. Without it, the framework is just a Playwright project template. It must exist before User Story 3 can execute the pipeline end-to-end.

**Independent Test**: Read `workflows/manifest.yaml` and confirm it defines all 8 pipeline steps with inputs, outputs, and gating rules. Read `adapters/pi/capabilities.yaml` and confirm every manifest capability maps to a concrete command template with `{{placeholders}}` matching the manifest's input schema.

**Acceptance Scenarios**:

1. **Given** the framework is installed, **When** the user reads `workflows/manifest.yaml`, **Then** they find 8 pipeline steps defined (resolve inputs, discover UI, extract selectors, draft page object, draft tests, write spec, run/fix tests, summarize/knowledge update) with each step listing its inputs, outputs, and whether it requires human approval.
2. **Given** the manifest is defined, **When** the user reads `adapters/pi/capabilities.yaml`, **Then** every capability in the manifest has a corresponding command template for the pi agent, and no capability is unmapped.
3. **Given** the pipeline architecture is in place, **When** a developer adds a new adapter file at `adapters/<agent>/capabilities.yaml` following the same schema as the pi adapter, **Then** they can wire up a second AI agent without modifying the manifest or prompt templates.
4. **Given** the pi adapter is configured, **When** the user invokes a pipeline step as a pi slash command (e.g., `/pipeline-discover example`), **Then** the pi agent executes the step using the command template from `adapters/pi/capabilities.yaml` with the resolved placeholders.

---

### User Story 3 — End-to-End Pipeline Run Against Example App (Priority: P3)

A QA engineer runs the full 8-step AI workflow pipeline against the bundled example application. They review AI-generated selector notes and page object drafts at the human review gates, approve them, and end up with a passing Playwright spec and populated knowledge files—all stored under `results/example/<run>/`.

**Why this priority**: This is the proof that the entire framework works. It validates every component from User Stories 1 and 2 together and produces the canonical artifacts that define framework success.

**Independent Test**: Invoke all 8 pipeline steps sequentially via pi slash commands against the example app. Verify that `results/example/<run>/step-*/` contains: UI snapshot, selector candidates list, page object draft, test scenario draft, final Playwright spec, test run report, pipeline summary, and updated knowledge files. Run `npx playwright test tests/example/` and confirm all generated tests pass.

**Acceptance Scenarios**:

1. **Given** the pipeline slash commands are executed against a running example app, **When** the discovery step completes, **Then** `results/example/<run>/step1-discover/` contains a Playwright accessibility snapshot and a list of extracted selector candidates.
2. **Given** discovery artifacts exist, **When** the AI agent drafts a page object and presents it for review, **Then** the human can read the draft, provide feedback, and only after explicit approval is the page object promoted to `src/pages/example/`.
3. **Given** page objects are approved, **When** the AI agent drafts GWT-style test scenarios and presents them for review, **Then** the human can approve or request changes, and only approved scenarios proceed to spec generation.
4. **Given** test scenarios are approved, **When** the AI agent writes the Playwright spec to `tests/example/`, **Then** the spec compiles without TypeScript errors and uses approved page objects.
5. **Given** the Playwright spec exists, **When** `npx playwright test tests/example/` is run, **Then** all tests pass and Playwright trace/screenshot artifacts are available for debugging.
6. **Given** tests pass, **When** the summarize/knowledge step completes, **Then** `knowledge/example/knowledge.md` and `knowledge/example/rules.md` contain verified observations from the run, and `results/example/<run>/pipeline-summary.md` summarizes all step outcomes.

---

### Edge Cases

- What happens when the pipeline is invoked but the target application is not running or unreachable? The resolve/discover step must detect this and produce a clear error artifact rather than silently failing.
- What happens when a human reviewer rejects a page object or test draft? The pipeline must support a re-draft loop — the AI agent receives the rejection reason and regenerates the artifact, then re-presents it for review.
- What happens when generated Playwright tests fail (script bugs)? The run/fix step must triage failures into script bugs (which the agent fixes) and app-level issues (which are reported but not modified).
- What happens when a user runs the same pipeline twice for the same app? New run artifacts go into a new `results/<app>/<new-run>/` directory. Previous run artifacts are never overwritten silently.
- What happens when a user provides a malformed app profile? The resolve step must validate the profile against the schema and fail with a descriptive message before any browser automation begins.
- What happens when the `.env` file is missing required variables? The resolve step must report which variables are missing rather than crashing with an opaque error mid-execution.

## Requirements *(mandatory)*

### Functional Requirements

**Framework Scaffold**:
- **FR-001**: The project MUST include a `package.json` with npm scripts for install, typecheck, lint (if configured), test, headed test, debug, and report.
- **FR-002**: The project MUST include a `tsconfig.json` with `strict: true` and path aliases for pages, fixtures, and helpers.
- **FR-003**: The project MUST include a `playwright.config.ts` that supports per-app test directories via config or CLI parameters.
- **FR-004**: The project MUST include a `.env.example` file documenting all required environment variables for every known app profile with placeholder values and no real secrets. In v1, this covers only the example app's variables. When new app profiles are added, `.env.example` MUST be updated to document their variables too. A "secret" is defined as: credentials, passwords, API tokens, authentication cookies, session tokens, Playwright storage state file contents, application-internal URLs not intended for public documentation, and any customer-specific data (PII, internal hostnames).
- **FR-005**: The project MUST include a `.gitignore` that excludes `.env`, `results/`, `node_modules/`, storage state files (`*.storage-state.json`, `state/`), and Playwright report folders (`playwright-report/`, `allure-report/`, `allure-results/`). Storage state files MUST be stored only at paths referenced by environment variables (never hardcoded) and MUST be excluded from version control.

**App Profiles & Example App**:
- **FR-006**: The project MUST include an app profile schema that defines two required fields (`name` and `baseUrlEnvVar`) and three optional fields (`authMethod` as free-text notes, `testTags` as a list, `storageStatePath` as a path string). A valid minimal profile needs only `name` and `baseUrlEnvVar`.
- **FR-007**: The project MUST include an example app profile at `apps/example/profile.yaml` following the schema.
- **FR-008**: The project MUST include a local static HTML page (example app) with form inputs, a data table, and navigation elements — zero external dependencies, zero credentials required.
- **FR-009**: The framework MUST support adding a new application by creating `apps/<app>/profile.yaml` and referencing environment variables for configuration.
- **FR-009a**: App profile `name` slugs MUST use only lowercase alphanumeric characters and hyphens (`[a-z0-9-]+`). Two profiles MUST NOT share the same `name`.
- **FR-009b**: Each pipeline run MUST target exactly one app profile. The profile is selected by the resolve-inputs step (Step 1) via a user-provided or defaulted app slug. No cross-app data leakage is permitted — one app's page objects, tests, knowledge, and results MUST NOT reference another app's configuration or artifacts.
- **FR-009c**: The `.gitignore` MUST exclude per-app `results/<app>/` directories in addition to the top-level `results/` exclusion.

**Pipeline Workflow Architecture**:
- **FR-010**: The project MUST include a `workflows/manifest.yaml` that defines 8 pipeline steps: resolve inputs, discover UI, extract selectors, draft page objects, draft tests, write Playwright spec, run tests and fix script bugs, summarize results and update knowledge.
- **FR-011**: Each manifest step definition MUST specify: step ID, human-readable name, input artifacts (paths with `{{placeholders}}`), output artifacts, and whether the step requires human approval (gated).
- **FR-012**: The project MUST include an adapter at `adapters/pi/capabilities.yaml` mapping every manifest capability to a concrete pi agent command template.
- **FR-013**: Each capability in the pi adapter (`adapters/pi/capabilities.yaml`) MUST include a `command_template` field containing the step instructions with `{{placeholder}}` variables consistent with the manifest's input schema. These templates are the canonical prompt for each pipeline step.
- **FR-014**: Pipeline steps MUST be invocable as pi slash commands during a pi agent session, mirroring the intelli-park-e2e adapter pattern where each capability translates to a command the pi agent executes.
- **FR-015**: The adapter schema MUST support adding new adapters (e.g., `adapters/claude/capabilities.yaml`) without modifying `workflows/manifest.yaml`. Each adapter provides its own command templates for the same manifest capabilities.

**Run Artifacts & Knowledge**:
- **FR-016**: Every pipeline run MUST produce artifacts under `results/<app>/<run>/step-<N>-<name>/` with a unique run identifier. Run identifiers MUST be ISO 8601 timestamps (e.g., `2026-04-30T143000Z`) to guarantee uniqueness and sortability. Before writing any artifact, the step MUST verify it is not silently overwriting an existing file — if a file exists at the target path, the step MUST either fail with a message or choose a new run identifier.
- **FR-017**: At minimum, each run MUST produce: UI snapshot (as Playwright ARIA snapshot YAML), selector candidates (as Markdown list with locator priority annotations), page object draft (as TypeScript), test scenario draft (as GWT Markdown), final Playwright spec (as TypeScript), test run report (as Markdown with pass/fail/triage per test), and a pipeline summary (as Markdown). Draft artifacts (page object draft, test scenario draft) MUST be retained in `results/` even after promotion to source directories — the `results/` copy serves as the run's immutable record. All artifact files MUST use the specified format; no binary-only or opaque formats are permitted.
- **FR-018**: The framework MUST scaffold app knowledge files at `knowledge/<app>/knowledge.md` (factual observations about the app's UI and behavior), `knowledge/<app>/rules.md` (actionable rules derived from verified observations, e.g., locator strategies), and `knowledge/<app>/selector-notes.md` (selector-specific findings with priority rationale). These files start empty or with placeholder scaffolding. `knowledge.md` and `rules.md` feed into each other — verified observations in `knowledge.md` inform new rules in `rules.md`, and rules guide future discovery steps.
- **FR-019**: The summarize/knowledge update step MUST write only verified observations back to the knowledge files. An observation is "verified" when it was successfully used in a passing Playwright test during the same pipeline run. Human-curated content (manually added outside the pipeline) MUST be preserved — the agent MUST append new content after a `## Run <run-id>` heading and MUST NOT modify or delete human-authored sections. The agent MUST NOT duplicate an observation already present in the file from a prior run.
- **FR-019a**: The summarize/knowledge update step MUST apply automated six-run archival pruning according to `knowledge/PRUNING_POLICY.md`. Non-human-curated entries that have been contradicted or superseded by the last six successful runs for the same app MUST be moved from active knowledge files to `knowledge/<app>/archive.md`, with the action recorded in `knowledge/<app>/prune-log.md`. Absence from recent runs alone MUST NOT trigger pruning. The step MUST maintain `knowledge/<app>/current.md` as a compact active summary for future pipeline context.

**Human Review & Approval**:
- **FR-020**: The pipeline MUST enforce human review gates on two specific steps before their artifacts are promoted from `results/` to source directories: (a) the draft page object step (page object promoted to `src/pages/<app>/`), and (b) the draft tests step (test scenarios promoted to `tests/<app>/`). These are the only gated steps in v1. Selector candidates and discovery snapshots are NOT gated — they remain in `results/` as reference artifacts only.
- **FR-021**: The human review mechanism MUST be a clear, chat-based workflow: (1) AI presents the full draft artifact text inline in the chat session for the human to read, (2) human replies with the exact word "approved" to promote, or provides change feedback as free-form text, (3) if changes are requested, AI re-drafts the artifact using the feedback as guidance and re-presents it. Maximum 3 re-draft attempts per artifact; if convergence is not reached, the step is marked as blocked with the unresolved feedback recorded.
- **FR-021a**: Each promoted artifact MUST carry a provenance header comment recording: the run ID that generated it, the ISO 8601 timestamp of approval, and the approving step (page-object-review or test-draft-review). This header is machine-readable for future drift detection.
- **FR-022**: Approved page-object artifacts MUST NOT be silently overwritten by subsequent pipeline runs. If a subsequent run would overwrite an approved page object, the AI MUST: (1) detect that the destination file already contains a provenance header from a previous approval, (2) present a diff of the proposed changes to the artifact to the human, (3) request explicit re-approval before writing. Generated Playwright specs are different: Step 6 MUST automatically overwrite `tests/<app>/<app>.spec.ts` after Step 5 approval, write a diff artifact to `results/<app>/<run>/step6-write-spec/spec.diff` when replacing an existing spec, and update the provenance header with the new run ID and timestamp without requesting an additional approval.

**Quality Gates**:
- **FR-023**: Generated Playwright specs MUST compile without TypeScript errors (`npm run typecheck`).
- **FR-024**: Generated Playwright specs MUST run successfully against the target app (`npx playwright test tests/<app>/`). For the example app, all generated tests must pass with zero failures.
- **FR-025**: Test failures in the run/fix step MUST be classified as either script bugs (which the AI fixes) or application-level issues (which are reported but not modified).
- **FR-026**: Playwright test runs MUST produce an HTML report and capture traces and screenshots. On test failure, a trace and screenshot MUST be captured per failing test. On success, a trace MAY be captured. All report artifacts (HTML report, traces, screenshots) MUST be stored under `results/<app>/<run>/step5-run-fix/` alongside the test run report.
- **FR-027**: The framework architecture MUST be extensible to support a second AI agent adapter without modifying `workflows/manifest.yaml`. The adapter schema defined in FR-015 ensures this. Additionally, the knowledge file schema MUST reserve space for `hypotheses.md` (deferred to post-v1) so that adding it later does not require restructuring existing knowledge files.

**Documentation**:
- **FR-028**: The project MUST include documentation (in `docs/` or the implementation plan's quickstart) explaining how to: install dependencies, serve the example app, add a new app profile, run the pipeline against an app, review generated artifacts, and interpret the results.

### Key Entities

- **AppProfile**: Represents a target application. Required attributes: `name` (slug) and `baseUrlEnvVar` (environment variable name referencing the base URL). Optional attributes: `authMethod` (free-text notes, e.g., "none", "basic-auth", "storage-state"), `testTags` (list of strings), `storageStatePath` (path to Playwright storage state file). Defined in `apps/<app>/profile.yaml`.

- **PipelineManifest**: Defines the 8-step workflow. Key attributes: list of steps, each with step ID, name, input artifact paths, output artifact paths, and gating flag. Defined in `workflows/manifest.yaml`.

- **AdapterCapabilities**: Maps neutral manifest capabilities to agent-specific slash commands. Key attributes: adapter name, list of capability mappings (manifest capability → `command_template` with `{{placeholders}}`). Defined in `adapters/<agent>/capabilities.yaml`. The `command_template` is the canonical prompt text the agent executes when the command is invoked.

- **RunArtifact**: A file produced by a pipeline step. Key attributes: run ID, step ID, artifact type (snapshot, selector-list, page-object-draft, test-draft, spec, report, summary), file path, creation timestamp. Stored under `results/<app>/<run>/step-<N>-<name>/`.

- **KnowledgeEntry**: Durable, app-specific knowledge accumulated across runs. Key attributes: app slug, category (knowledge, rules, selector-notes), content, verification status (observed/verified/human-curated). Stored under `knowledge/<app>/`.

- **ApprovalGate**: A checkpoint in the pipeline where human review is required. Key attributes: step ID, artifact paths requiring approval, approval status (pending/approved/rejected), rejection reason (if any).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user cloning the repository for the first time can run `npm install && npm run typecheck` and see zero errors within 2 minutes.
- **SC-002**: A user can read the app profile schema and documentation and add a new app profile for their own target application in under 10 minutes without modifying any framework source code.
- **SC-003**: The example app page renders in a browser and all specified interactive elements (a form with at least 2 input fields and a submit button, a data table with at least 3 rows and 2 columns, and a navigation element with at least 2 links) are present in the DOM and respond to standard Playwright interactions (fill, click).
- **SC-004**: All 8 pipeline steps execute against the example app and produce a passing Playwright spec — the generated tests run and pass with zero failures.
- **SC-005**: Two different AI agents (starting with pi, architecture-ready for a second) can follow the same manifest workflow (via their respective adapters) and produce pipeline artifacts where: (a) the same 7 artifact files exist at the same relative paths, (b) selector candidates use the same locator priority order (role → testid → label → text → CSS), and (c) generated tests cover the same set of interactive elements identified in the discovery snapshot.
- **SC-006**: A human reviewer can read an AI-generated page object draft, understand it, and make an approval decision in under 5 minutes per artifact.
- **SC-006a**: The human review process for a pipeline run completes with at most 1 re-draft cycle per gated artifact (i.e., the first re-draft after feedback is accepted) for at least 80% of pipeline runs.
- **SC-007**: Results from a pipeline run are self-contained under a single `results/<app>/<run>/` directory, and a new run creates a new directory without overwriting previous results.
- **SC-008**: A new user following only the framework's documentation (without external help, reference to DESIGN_DECISIONS.md, or prior knowledge of intelli-park-e2e) can serve the example app, invoke all 8 pipeline slash commands, review generated artifacts, and confirm passing tests within 30 minutes.

## MVP Scope

**v1 MVP boundary**: User Stories P1 (Framework Scaffold) + P2 (Pipeline Architecture) + P3 (End-to-End Pipeline Run) constitute the full v1 deliverable. All three must be complete for v1 to ship. There is no partial-MVP slice within v1 — the pipeline must run end-to-end against the example app.

**Explicitly deferred to post-v1**:
- Multi-agent comparison runs (pi-only in v1)
- Automated orchestration engine (manual slash-command invocation in v1)
- Approval lock file automation with SHA-256 hashing
- `hypotheses.md` and `INDEX.md` knowledge files (schema defined, implementation deferred)
- Quickstart usability testing with external users
- Framework extraction to a standalone npm package

## Assumptions

- The primary AI agent for v1 is pi. The framework architecture supports additional agents (Claude, openCode, Copilot) but v1 targets pi exclusively as decided in DESIGN_DECISIONS.md.
- The example application is a local static HTML page with form inputs, a data table, and navigation elements. It requires no backend, no authentication, and no network access.
- Pipeline steps are invoked as pi slash commands during a pi agent session, using the command templates defined in `adapters/pi/capabilities.yaml`. There is no automated orchestration engine in v1. The user triggers each step with the appropriate slash command.
- Human review gates use a chat-based approval flow: the AI presents the draft, the human replies in the same chat session. No external approval tooling or lock file automation exists in v1.
- Knowledge files start empty and are populated by the pipeline run itself. The knowledge lifecycle (empty → populated → updated) proves the framework's knowledge management capability.
- The framework itself has no separate Playwright test suite for its own source code. The pipeline run against the example app serves as the integration test (per DESIGN_DECISIONS.md Decision 11). `npm run typecheck` (SC-001) validates TypeScript correctness across all framework source files but does not execute tests against framework internals.
- TypeScript strict mode and no `any` types are constitutional requirements (Principle IX), not optional.
- All secrets (base URLs, credentials, tokens) are referenced by environment variable names only. The framework never stores or reads real values from tracked files.
- The project depends on `@playwright/test` (latest stable) as its sole E2E test framework, per constitutional Principle II. This is a hard dependency, not an implementation choice.
