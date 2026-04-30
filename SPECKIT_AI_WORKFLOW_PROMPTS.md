# Speckit Prompt Pack: Playwright AI Workflow Framework

Use this prompt pack from the project root (`/home/ryga/Documents/Playwright_playground`) after initializing Spec Kit/Speckit. It is tailored for building a reusable Playwright framework for experimenting with AI-assisted E2E workflows across multiple applications, inspired by `/home/ryga/Documents/UKPC SAAS/intelli-park-e2e`.

## One-time setup

```bash
specify init --here
```

If asked for an agent integration, choose the agent you will use most often in this repo. Then run the phases below in order.

---

## Phase 0 — Constitution (`/constitution`) ✅ COMPLETED

```text
/constitution
Create the project constitution for "Playwright AI Workflow Playground".

[See .specify/memory/constitution.md — v1.0.0 ratified 2026-04-30 with 10 principles, tech stack, workflow, governance]
```

Output: `.specify/memory/constitution.md` — 10 principles (I–X), Technology Stack & Constraints, Development Workflow & Quality Gates, Governance. Ratified v1.0.0.

---

## Phase 1 — Feature Specification (`/specify`) ✅ COMPLETED

```text
/specify
Create a Playwright AI Workflow Playground framework.

[See specs/001-ai-e2e-framework/spec.md — 3 user stories, 28 FRs, 9 SCs, 6 entities, MVP scope section]
```

Output: `specs/001-ai-e2e-framework/spec.md` with user stories (P1: Framework Scaffold, P2: Pipeline Architecture, P3: E2E Pipeline Run), 28 functional requirements, 6 key entities, 9 success criteria, 6 edge cases, 9 assumptions, and explicit MVP scope section.

---

## Phase 2 — Clarification (`/clarify`) ✅ COMPLETED

Clarifications resolved (see spec.md §Clarifications > Session 2026-04-30):

1. **Slash-command wrappers only** — pipeline steps invoked as pi agent commands via `adapters/pi/capabilities.yaml`. No standalone `prompts/` directory. Mirrors intelli-park-e2e adapter pattern.
2. **Minimum app profile** — only `name` and `baseUrlEnvVar` required. `authMethod`, `testTags`, `storageStatePath` all optional.

---

## Phase 3 — Requirements Quality Checklist (`/checklist`) ✅ COMPLETED

All 43 checklist items resolved. See `specs/001-ai-e2e-framework/checklists/requirements.md`.

Key gaps filled during checklist phase:
- Gated steps explicitly listed in FR-020 (page object draft + test draft)
- Artifact post-promotion retention specified in FR-017
- MVP Scope section added to spec body
- SC-003 quantified with minimum element counts
- Approval signal format ("approved"), re-draft limit (3), provenance headers (FR-021a)
- Secret definition expanded, storage state conventions (FR-004, FR-005)
- Report artifact requirements (FR-026), extensibility requirement (FR-027)
- Knowledge verification criteria, dedup, relationships (FR-018, FR-019)
- SC-005 comparability criteria, SC-008 30-minute timebox, SC-006a review metric

---

## Phase 4 — Implementation Plan (`/plan`)

```text
/plan
Create the implementation plan for the Playwright AI Workflow Playground.

Technology choices:
- TypeScript (strict: true, no `any` without justification)
- Node.js/npm
- ES modules (`"type": "module"` in package.json)
- @playwright/test (latest stable — constitutional hard dependency per Principle II)
- YAML for workflow manifest, app profiles, adapter capabilities (no standalone prompts/ directory — commands live in capabilities.yaml per clarification Q1)
- dotenv for local environment variables if needed

Architecture guidance:
- Use /home/ryga/Documents/UKPC SAAS/intelli-park-e2e only as a reference for concepts: artifact folders, knowledge files, adapter-driven commands, approval gates, and run reports.
- Keep the new framework generic and not tied to UKPC/eCam.
- Prefer this root structure (per DESIGN_DECISIONS.md Decision 8 — monorepo-lite):
  - package.json (set `"type": "module"`)
  - playwright.config.ts
  - tsconfig.json
  - .env.example
  - apps/<app>/profile.yaml
  - adapters/<agent>/capabilities.yaml
  - src/pages/<app>/
  - src/fixtures/
  - src/helpers/
  - src/types/
  - tests/<app>/
  - workflows/manifest.yaml
  - knowledge/<app>/   (knowledge.md, rules.md, selector-notes.md; hypotheses.md schema reserved but deferred to post-v1)
  - results/<app>/     (gitignored — run output only)
  - specs/
  - docs/
- Define workflow artifacts for each AI step per FR-017 (all text-based formats — YAML, Markdown, TypeScript; no binary-only or opaque formats):
  - Step 1 (resolve): app profile validation, run ID (ISO 8601 timestamp)
  - Step 2 (discover): Playwright ARIA snapshot (YAML), selector candidates (Markdown with locator priority annotations)
  - Step 3 (extract selectors): normalized selector list (Markdown)
  - Step 4 (draft page object): TypeScript page object draft → GATED — human review required
  - Step 5 (draft tests): GWT Markdown test scenarios → GATED — human review required
  - Step 6 (write spec): TypeScript Playwright spec (only after both gates approved)
  - Step 7 (run/fix): test run report (Markdown with pass/fail/triage), HTML report, traces, screenshots
  - Step 8 (summarize): pipeline summary (Markdown), knowledge file updates (append under ## Run <run-id> headings)
- Provenance headers: each promoted artifact MUST carry a header comment (run ID, ISO 8601 approval timestamp, approving step) per FR-021a
- Overwrite protection: detect provenance header in destination, present diff, request re-approval per FR-022
- Human review: exact word "approved" in chat, max 3 re-drafts, blocked state with unresolved feedback recorded per FR-021

App profile schema (per FR-006, clarification Q2):
- Required: `name` (slug, `[a-z0-9-]+`, unique), `baseUrlEnvVar` (environment variable name)
- Optional: `authMethod` (free-text notes), `testTags` (string list), `storageStatePath` (path string)

MVP scope (per spec §MVP Scope): P1 + P2 + P3 = full v1. Deferred: multi-agent comparison, automated orchestration, lock file automation, hypotheses.md/INDEX.md, quickstart usability testing, framework npm package extraction.

Planning deliverables:
- research.md with key decisions and alternatives
- data-model.md for app profiles, workflow runs, artifacts, approval gates, knowledge entries (use Key Entities from spec as starting point)
- contracts/ with profile schema, manifest schema, adapter schema, approval lock schema
- quickstart.md with end-to-end usage
- Constitution Check against all 10 principles (I–X) — document any justified exceptions
```

Expected output: `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.

---

## Phase 5 — Task Generation (`/tasks`)

```text
/tasks
Generate dependency-ordered implementation tasks for the Playwright AI Workflow Playground.

Task requirements:
- Organize tasks by independently testable user story (US1: Framework Scaffold, US2: Pipeline Architecture, US3: E2E Pipeline Run).
- Mark tasks parallelizable where they touch different files.
- Include exact file paths.
- Include setup tasks for npm, TypeScript, Playwright config, .gitignore, .env.example, and baseline docs.
- Include schema/example tasks for apps/example/profile.yaml, workflows/manifest.yaml, and adapters/pi/capabilities.yaml (no prompts/ directory — commands live in capabilities.yaml).
- Include adapter/capability tasks for each pipeline step: resolve inputs, discover UI, extract selectors, draft page object, draft tests, write spec, run/fix, summarize/update knowledge.
- Include source tasks for fixtures, page object conventions, sample tests, example app HTML page, and artifact helpers.
- Include review gate tasks: provenance header injection, overwrite detection via provenance headers, diff presentation, re-approval flow.
- Include quality tasks: npm scripts, typecheck/lint if configured, Playwright HTML report generation, trace/screenshot capture per FR-026, and explicit cross-app isolation verification for FR-009b.
- Include extensibility tasks: adapter schema validation, hypotheses.md slot in knowledge schema per FR-027.
- Do not create vague tasks like "implement framework". Every task must name concrete files and expected outputs.
```

Expected output: `tasks.md` with phases, dependencies, parallel batches, and MVP path.

---

## Phase 6 — Cross-artifact Analysis (`/analyze`)

```text
/analyze
Analyze spec.md, plan.md, and tasks.md for consistency before implementation.

Check for:
- requirements in spec with no tasks (verify all 28 FRs covered)
- tasks not justified by spec or plan
- constitution violations (check all 10 principles)
- missing app isolation tasks (FR-009a/b/c, including explicit cross-app leakage verification)
- missing secrets safety tasks (FR-004, FR-005)
- missing Playwright run/report tasks (FR-026 — HTML report, traces, screenshots)
- missing approval gate tasks (FR-020, FR-021, FR-021a, FR-022)
- missing knowledge update tasks (FR-018, FR-019 — verification criteria, dedup, append-only)
- missing extensibility tasks (FR-027 — second adapter, hypotheses.md slot)
- ambiguous folder names or artifact paths
- conflicts between generic framework goals and copied assumptions from intelli-park-e2e
- package.json / tsconfig module-system mismatch (ESM `"type": "module"` vs NodeNext config)
- spec references to `prompts/` that should have been removed per clarification Q1

Do not edit files. Return a prioritized remediation report with critical/high/medium/low findings and proposed fixes.
```

Expected output: read-only analysis report. Fix issues manually or rerun relevant phases before implementation.

---

## Phase 7 — Implementation (`/implement`)

```text
/implement
Implement the Playwright AI Workflow Playground by executing tasks.md in dependency order.

**MVP focus for the first implementation pass**: complete **US1 only** (Framework Scaffold with Example App). Do not start US2 or US3 until US1 is fully implemented and validated.

Implementation rules:
- Follow tasks.md exactly and mark tasks complete as they finish.
- Preserve the generic multi-application design (no UKPC/eCam assumptions).
- Do not introduce real credentials, cookies, storage state, or customer-specific data.
- Pipeline commands live in adapters/pi/capabilities.yaml — no standalone prompts/ directory.
- Prefer minimal working framework over over-engineered abstractions.
- For the first pass, complete Phase 1, Phase 2, and US1 tasks only.
- Run available checks at the end of US1: npm install if needed, npm run typecheck/lint if present, and a local example-app sanity check (serve `apps/example/` and confirm interactive elements render).
- Verify the scaffold meets FR-001 through FR-009c before moving on.
- If a task requires external application access, create the artifact/example/template and document what the user must provide locally.

After the US1 pass, summarize changed files, checks run, and any follow-up tasks. Then STOP and wait for the user before proceeding to US2/US3.
```

Expected output: implemented framework files and updated `tasks.md` completion state for US1 only.

---

## Optional Phase 8 — First experiment feature (`/specify` again)

After the framework exists, use a separate feature spec for each target application experiment.

```text
/specify
Add the first AI-assisted Playwright experiment for <APP_NAME>.

Target application:
- Name: <APP_NAME>  (slug: lowercase alphanumeric + hyphens only)
- Base URL env var: <APP_NAME>_BASE_URL
- Auth method: <none | storage-state | basic-auth | other>  (free-text notes OK)
- Primary workflow goal: <discover UI | generate smoke test | compare AI agents | repair existing test | other>

Requirements:
- Create or update apps/<app>/profile.yaml without storing secrets (only name + baseUrlEnvVar required).
- Run or document the AI workflow phases for discovery, selectors, page object draft, test draft, human review, spec writing, test execution, repair loop, and knowledge update.
- Store all artifacts under results/<app>/<experiment>/.
- Store durable knowledge under knowledge/<app>/ (knowledge.md, rules.md, selector-notes.md).
- Add only tests that can run with local user-provided environment variables.
- Update .env.example with the new app's required variables per FR-004.
```
