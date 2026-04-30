<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template placeholder) → 1.0.0 (initial ratification)
  Modified principles: N/A (all principles are new — first substantive constitution)
  Added sections:
    - Core Principles I–X (10 principles from project charter)
    - Technology Stack & Constraints
    - Development Workflow & Quality Gates
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check gate is generic)
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
    - .specify/templates/checklist-template.md ✅ no changes needed
  Follow-up TODOs: none — all placeholders resolved
-->

# Playwright AI Workflow Playground Constitution

## Core Principles

### I. Spec-First Workflow (NON-NEGOTIABLE)

Every framework capability MUST begin with a Speckit specification before any code is written.
The canonical sequence is: spec → clarifications → plan → tasks → implementation.
No feature, experiment, adapter, or structural change may skip this pipeline.

**Rationale**: The framework exists to experiment with AI-assisted testing workflows.
The specification phase produces the requirements, acceptance criteria, and design decisions
that AI agents (and humans) use to generate consistent, comparable output. Without a spec,
different agents produce incomparable artifacts, and the experimentation goal is lost.

### II. Playwright-First E2E Design

All tests MUST use `@playwright/test` with TypeScript. Page objects and fixtures SHOULD be
used where they reduce duplication and improve readability. Locator strategy MUST follow the
priority order:

1. `getByRole` (accessible, resilient to DOM changes)
2. `getByTestId` / `data-testid` (intentional, application-controlled)
3. `getByLabel` / `getByPlaceholder` (user-facing text associations)
4. `getByText` (visible content, but fragile to copy changes)
5. CSS selectors / XPath (last resort, brittle)

Brittle selectors (CSS, XPath) MUST be justified with an inline comment explaining why no
better locator is available.

**Rationale**: Playwright's auto-waiting, retry logic, and tracing are the foundation of
reliable E2E tests. The locator priority mirrors Playwright's own recommendations and the
reference project's proven approach. Tests that break on minor UI changes waste the
experimentation cycles this framework is designed to support.

### III. AI Workflow Experimentation

The framework MUST support multiple AI coding assistants through a layered architecture:

- **Prompt files** (`prompts/`): Human-copyable step-level prompt templates with
  `{{placeholder}}` variables. Describe WHAT to do, not HOW a specific agent does it.
- **Workflow manifest** (`workflows/manifest.yaml`): Neutral capability definitions
  listing each pipeline step, its inputs, outputs, and gating rules.
- **Adapters** (`adapters/<agent>/capabilities.yaml`): Agent-specific command templates
  mapping manifest capabilities to concrete commands or chat prompts for that agent.

The framework MUST support at minimum one adapter (pi for v1). The architecture MUST
leave room for additional adapters (openCode, Claude Code, Copilot, etc.) without
modifying the manifest or prompt files.

**Rationale**: The framework's purpose is to compare AI agents on the same testing task.
A layered architecture (manifest → prompts → adapters) keeps the task definition neutral
and the agent bindings swappable.

### IV. Human Review Gates

AI-generated artifacts—selectors, page objects, test drafts—MUST be reviewed by a human
before they are promoted into source files. The review mechanism for v1 is:

1. AI agent writes draft artifacts to `results/<app>/<run>/step-*/`
2. AI agent presents the draft to the human and requests approval in chat
3. Human reads the draft and replies "approved" or gives change feedback
4. Only after explicit human approval may the artifact be promoted to source folders
   (e.g., `src/pages/<app>/`, `tests/<app>/`)

The approval lock schema (`.approval-lock.json` with SHA-256 hashes of approved artifacts)
MUST be defined in contracts so automated drift detection can be added later.

**Rationale**: AI-generated tests against real applications carry risk. A hallucinated
selector or misunderstood UI flow produces false confidence. Human review is the safety
net. Defining the lock schema now ensures the automation path exists without blocking v1.

### V. Reproducible Artifacts

Every workflow run MUST write canonical artifacts under `results/<app>/<run>/step-*/`.
At minimum, each step produces one or more of:

- Playwright accessibility snapshots
- Extracted selector candidate lists
- Draft page objects
- Draft GWT-style test scenarios
- Final Playwright spec files (after approval and promotion)
- Test run reports (pass/fail/triage)
- Knowledge file updates (verified observations)
- A pipeline summary (`pipeline-summary.md`)

Artifacts MUST be deterministic enough that two runs of the same workflow against the
same app with the same agent produce structurally comparable output. This is a
requirement for meaningful agent comparisons.

**Rationale**: Reproducibility is the bedrock of experimentation. Without canonical
artifact folders, comparing two agents' approaches requires guesswork. Deterministic
output enables diff-based comparison and trend analysis across runs.

### VI. App Isolation

Each target application MUST receive isolated resources:

- Config profile: `apps/<app>/profile.yaml`
- Credential references: `${APP}_BASE_URL`, `${APP}_USERNAME`, etc. (never values)
- Page objects: `src/pages/<app>/`
- Tests: `tests/<app>/`
- Knowledge: `knowledge/<app>/`
- Results: `results/<app>/`

No hard-coded assumptions about UKPC, eCam, or any specific application domain.
The framework must treat every app as a blank slate with a profile.

**Rationale**: Application-agnosticism is the core differentiator from the reference
project. The framework must work for parking management, e-commerce, dashboards, or
any other web application without refactoring structural code.

### VII. Safe Secrets Handling

The following MUST NEVER be committed to version control:

- Real credentials, API tokens, or passwords
- Authentication cookies or session tokens
- Playwright storage state files containing authenticated sessions
- Customer data, screenshots containing PII, or application-internal URLs that reveal
  infrastructure details

Project MUST use `.env.example` to document required environment variables with
placeholder values. Developers copy to `.env` (gitignored) and fill in local values.
Storage state paths are referenced by environment variable, not hardcoded.

**Rationale**: A test framework repository is a high-value target. Compromised
credentials in git history are effectively permanent. The `.env.example` pattern is
standard, well-understood, and enforced by `.gitignore`.

### VIII. Quality Gates

Generated tests MUST pass all of these gates before being considered complete:

- **Runnable**: `npx playwright test tests/<app>/<spec>.spec.ts` executes without
  configuration errors
- **Lintable**: Passes `npm run lint` (ESLint) without errors
- **Type-safe**: Passes `npm run typecheck` (`tsc --noEmit`) without errors
- **Traceable**: Playwright trace, video, and screenshot artifacts are generated and
  accessible for debugging failed runs
- **Reportable**: HTML report or Allure report is generated and human-readable

A test that cannot be run, linted, or type-checked is not a deliverable.

**Rationale**: AI-generated code often contains subtle errors (wrong imports, type
mismatches, syntax issues from hallucinated APIs). These gates catch the most common
failure modes before human review, making review time productive rather than
debugging time.

### IX. Clean TypeScript Structure

All framework code MUST be TypeScript (`.ts`), not JavaScript (`.js`).
The following TypeScript quality rules are non-negotiable:

- `strict: true` in `tsconfig.json`
- No `any` types without an explicit `// eslint-disable-next-line @typescript-eslint/no-explicit-any` justification comment
- Explicit return types on exported functions and methods
- Path aliases (`@pages/*`, `@fixtures/*`, `@helpers/*`) for clean imports
- `ES2022` target, `CommonJS` or `ESM` module system (consistent across the project)

**Rationale**: Strong typing catches bugs at compile time, improves IDE tooling
(autocomplete, refactoring, go-to-definition), and makes the framework
self-documenting. AI agents also produce more accurate code when TypeScript types
constrain their output.

### X. Disciplined Version Control

Commits MUST be atomic and follow conventional commit format tied to Speckit phases:

- `feat(constitution): ...` — constitution updates
- `feat(spec): ...` — specification artifacts
- `feat(plan): ...` — implementation plans
- `feat(structure): ...` — framework scaffolding, config, adapters
- `feat(app-<name>): ...` — app-specific page objects, tests, profiles
- `fix(pipeline): ...` — pipeline step bug fixes
- `fix(tests): ...` — test bug fixes (script bugs, not app bugs)
- `docs(...): ...` — documentation-only changes
- `chore(...): ...` — dependency updates, config tweaks

Files that MUST be in `.gitignore`:
- `.env`
- `results/` (all generated run output)
- `node_modules/`
- Playwright storage state files (`*.storage-state.json`, `state/`)
- Report folders (`playwright-report/`, `allure-report/`, `allure-results/`)

Git tracks source, not run output. `results/` is the framework's working directory,
not its deliverable.

**Rationale**: Conventional commits make the project history machine-readable for
changelog generation and semantic versioning. Separating source from output keeps the
repository small, clean, and safe. The tie to Speckit phases makes every commit
traceable to a specification checkpoint.

## Technology Stack & Constraints

### Mandatory Stack

| Layer | Technology | Constraint |
|-------|-----------|------------|
| Language | TypeScript | `strict: true`, no `any` without justification |
| Runtime | Node.js 18+ | LTS versions only |
| Test framework | `@playwright/test` | Latest stable |
| Package manager | npm | Consistent lockfile (`package-lock.json`) |
| Config format | YAML or JSON | Human-readable, no code-as-config |
| Prompt format | Markdown | Any AI assistant can read it |
| Secrets | `dotenv` + `.env.example` | Never commit `.env` |

### Prohibited

- Hard-coded credentials, URLs, or tokens in any file tracked by git
- Customer-specific or application-internal data in prompts, fixtures, or test data files
- Opaque binary workflow definitions (no compiled DSLs)
- Framework code in plain JavaScript (`.js` files in `src/`, `tests/`, `adapters/`, or `workflows/`)

### Encouraged

- `@fixtures/*` for shared Playwright fixtures (auth, app context, page objects)
- `@pages/*` path aliases for clean imports
- `@helpers/*` for utility functions (selector helpers, artifact writers, snapshot parsers)

## Development Workflow & Quality Gates

### Speckit Phase Pipeline

Every feature or experiment follows these phases in order:

| Phase | Command | Output | Purpose |
|-------|---------|--------|---------|
| Constitution | `/constitution` | `.specify/memory/constitution.md` | Ratify project principles |
| Specify | `/specify` | `specs/<feature>/spec.md` | Define requirements, user stories, success criteria |
| Clarify | `/clarify` | Updated `spec.md` with clarifications section | Resolve ambiguities before planning |
| Checklist | `/checklist` | `specs/<feature>/checklists/requirements.md` | Validate requirement quality |
| Plan | `/plan` | `specs/<feature>/plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | Technical design and architecture |
| Tasks | `/tasks` | `specs/<feature>/tasks.md` | Dependency-ordered implementation tasks |
| Analyze | `/analyze` | Read-only consistency report | Cross-artifact validation before implementation |
| Implement | `/implement` | Source files, passing tests, updated `tasks.md` | Execute tasks in order |

### Pipeline Step Ordering (per DESIGN_DECISIONS.md)

The AI workflow pipeline runs these steps sequentially for a given app:

1. Resolve inputs and select app/profile
2. Discover UI with Playwright snapshots
3. Extract selector candidates
4. Draft or update page objects → **Human review gate**
5. Draft GWT-style test scenarios → **Human review gate**
6. Write Playwright spec (after approval)
7. Run tests and triage failures (script bugs fixed, app bugs reported only)
8. Summarize results and update knowledge files

### Quality Gates (per run)

- TypeScript compilation: `npm run typecheck` passes with zero errors
- Linting: `npm run lint` passes (if ESLint configured)
- Tests: `npm test` passes for framework smoke tests
- Generated tests for app: `npx playwright test tests/<app>/` passes
- Artifacts: `results/<app>/<run>/` contains all expected step outputs
- No secrets in any tracked file (verify with `git diff --cached` before commit)

### Constitutional Compliance

Every feature plan MUST include a **Constitution Check** section that:
- Lists each of the 10 principles (I–X) and verifies compliance
- Documents any justified exceptions with rationale
- References the specific design decision (from DESIGN_DECISIONS.md or the plan itself)

The constitution overrides generated plans and tasks. If a generated task violates a
principle, the task must be modified or dropped, and the modification documented.

## Governance

### Amendment Procedure

1. Propose the change with rationale in a feature spec or dedicated amendment document
2. If the change affects existing artifacts, include a migration plan
3. Update the constitution with the amendment and increment the version
4. Run `/analyze` on any affected specs/plans/tasks to detect inconsistencies
5. Commit with `feat(constitution): <summary>` per Principle X

### Versioning Policy

Constitution versions follow Semantic Versioning:

- **MAJOR** (X.0.0): Backward-incompatible governance changes — principle removal,
  redefinition of a core principle, or reversal of a non-negotiable rule
- **MINOR** (0.Y.0): New principle added, new section added, or materially expanded
  guidance that does not invalidate existing artifacts
- **PATCH** (0.0.Z): Clarifications, typo fixes, formatting, non-semantic refinements

### Compliance Review

- Every `/plan` run MUST include a Constitution Check
- Every `/implement` run SHOULD verify the completed work against the constitution
- Exceptions to any principle MUST be documented in the feature plan with a clear
  rationale and an explicit "why simpler alternative rejected" statement
- Prefer simple, inspectable Markdown/YAML/TypeScript over opaque automation
- Keep generated workflow prompts deterministic enough to produce comparable output
  across agents

### Relationship to Other Documents

- **DESIGN_DECISIONS.md**: Records decisions from the grill-me session (2026-04-30)
  that refine and constrain v1 scope. These are binding within v1 but may be revised
  in future feature specs.
- **SPECKIT_AI_WORKFLOW_PROMPTS.md**: The canonical prompt pack for running each
  Speckit phase. These prompts reference and implement the constitution.
- **AGENTS.md**: Runtime guidance for AI agents working in this repository. Must not
  contradict the constitution.

### Development Guidance

For runtime development instructions (setup, scripts, project structure), refer to
the implementation plan (`specs/<feature>/plan.md`) and quickstart guide
(`specs/<feature>/quickstart.md`) produced by the `/plan` phase.

**Version**: 1.0.0 | **Ratified**: 2026-04-30 | **Last Amended**: 2026-04-30
