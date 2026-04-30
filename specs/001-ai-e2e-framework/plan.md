# Implementation Plan: Playwright AI E2E Framework

**Branch**: `001-ai-e2e-framework` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-ai-e2e-framework/spec.md`

## Summary

Build a generic TypeScript Playwright repository for experimenting with AI-assisted E2E testing workflows across multiple web applications. The framework provides a layered architecture (manifest → adapter capabilities → slash commands), a local example app for zero-dependency pipeline execution, human review gates with provenance tracking, and canonical artifact storage under `results/<app>/<run>/`. v1 delivers the full 8-step pipeline end-to-end against the bundled example app with a single agent adapter (pi).

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022 target, `strict: true`)
**Primary Dependencies**: `@playwright/test` (latest stable), `dotenv`, `typescript`
**Storage**: Filesystem — YAML (profiles, manifest, capabilities), Markdown (prompts, knowledge, reports), TypeScript (page objects, specs, fixtures)
**Testing**: `@playwright/test` — framework integration verified via pipeline run against example app (no separate framework test suite per Decision 11)
**Target Platform**: Node.js 18+ LTS, Linux/macOS (Playwright browser automation)
**Project Type**: Framework/library — monorepo-lite with cohabitating app instances
**Performance Goals**: N/A (framework, not a service — pipeline throughput limited by Playwright browser speed and human review latency)
**Constraints**: No real credentials, tokens, or secrets in tracked files; no binary-only or opaque artifact formats; app-agnostic (zero UKPC/eCam assumptions)
**Scale/Scope**: 1 example app (local static HTML), 1 agent adapter (pi), 8 pipeline steps, 28 functional requirements, deferred multi-agent and lock-file automation to post-v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-First Workflow | ✅ PASS | This plan is Phase 4 of the canonical sequence (constitution → spec → clarify → checklist → plan). All prior phases completed. |
| II. Playwright-First E2E Design | ✅ PASS | `@playwright/test` is sole test framework; locator priority (role → testid → label → text → CSS) codified in spec FR-017 selector format and SC-005 comparability criteria. |
| III. AI Workflow Experimentation | ✅ PASS | Layered architecture: `workflows/manifest.yaml` (neutral) → `adapters/<agent>/capabilities.yaml` (agent-specific). Pi adapter for v1, extensible schema for second agent (FR-015, FR-027). |
| IV. Human Review Gates | ✅ PASS | Two gated steps (page object draft, test draft) per FR-020. Chat-based approval with exact "approved" keyword, max 3 re-drafts, provenance headers (FR-021, FR-021a). Approval lock schema defined in contracts for future automation. |
| V. Reproducible Artifacts | ✅ PASS | `results/<app>/<run>/step-<N>-<name>/` with ISO 8601 run IDs (FR-016). All 7 artifact types with explicit formats (FR-017). Deterministic enough for agent comparison (SC-005). |
| VI. App Isolation | ✅ PASS | Per-app profiles (`apps/<app>/`), page objects (`src/pages/<app>/`), tests (`tests/<app>/`), knowledge (`knowledge/<app>/`), results (`results/<app>/`). Slug naming `[a-z0-9-]+` with uniqueness (FR-009a). Cross-app leakage forbidden (FR-009b). |
| VII. Safe Secrets Handling | ✅ PASS | `.env.example` documents all variables with placeholders (FR-004). `.gitignore` excludes `.env`, `results/`, storage state, report folders (FR-005). "Secret" explicitly defined in FR-004. |
| VIII. Quality Gates | ✅ PASS | TypeScript compilation (FR-023), test execution (FR-024), failure triage (FR-025), HTML report + traces + screenshots (FR-026). All text-based formats, no opaque binaries. |
| IX. Clean TypeScript Structure | ✅ PASS | `strict: true`, path aliases (`@pages/*`, `@fixtures/*`, `@helpers/*`), no `any` without justification (FR-002). All framework files are `.ts`. |
| X. Disciplined Version Control | ✅ PASS | Conventional commits tied to Speckit phases. `.gitignore` per FR-005 excludes all run output, secrets, and storage state. |

**Result**: All 10 principles pass. No violations or justified exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-e2e-framework/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — schemas for profiles, manifest, adapters, approval locks
├── checklists/
│   └── requirements.md  # Phase 3 output
└── tasks.md             # Phase 5 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
/
├── package.json                    # npm scripts: install, test, test:headed, test:debug, report, typecheck, lint
├── playwright.config.ts            # Per-app test dirs via config; browser settings
├── tsconfig.json                   # strict: true, ES2022, path aliases (@pages, @fixtures, @helpers)
├── .env.example                    # All env vars with placeholder values, no real secrets
├── .gitignore                      # .env, results/, node_modules/, *.storage-state.json, state/, report dirs
│
├── apps/
│   └── example/
│       ├── profile.yaml            # Minimal profile: name + baseUrlEnvVar only
│       └── index.html              # Static example app: form, table, navigation
│
├── adapters/
│   └── pi/
│       └── capabilities.yaml       # Pi command templates for all 8 manifest capabilities
│
├── workflows/
│   └── manifest.yaml               # 8 neutral capability definitions with inputs/outputs/gating
│
├── src/
│   ├── pages/
│   │   └── example/                # Page objects for example app (generated, then approved)
│   ├── fixtures/
│   │   └── base.fixture.ts         # Shared fixtures: page, browser context, app config
│   └── helpers/
│       ├── artifact-writer.ts      # Write artifacts to results/<app>/<run>/step-*/
│       ├── profile-loader.ts       # Load and validate app profiles
│       └── snapshot-parser.ts      # Parse Playwright ARIA snapshots for selector extraction
│
├── tests/
│   └── example/                    # Generated Playwright specs for example app (after approval)
│
├── knowledge/
│   └── example/
│       ├── knowledge.md            # Factual UI/behavior observations (populated by pipeline)
│       ├── rules.md                # Actionable rules from verified observations
│       └── selector-notes.md       # Selector findings with priority rationale
│
├── results/                        # GITIGNORED — canonical run output
│   └── example/
│       └── <run-id>/               # ISO 8601 timestamp
│           ├── step1-resolve/
│           ├── step2-discover/
│           ├── step3-extract-selectors/
│           ├── step4-draft-page-object/
│           ├── step5-draft-tests/
│           ├── step6-write-spec/
│           ├── step7-run-fix/
│           └── step8-summarize/
│
├── specs/                          # Speckit feature specs
│   └── 001-ai-e2e-framework/
│
├── docs/
│   └── README.md                   # Framework overview and usage guide
│
├── contracts/                      # Schemas (generated in plan phase)
│   ├── profile.schema.yaml
│   ├── manifest.schema.yaml
│   ├── adapter.schema.yaml
│   └── approval-lock.schema.yaml
│
├── DESIGN_DECISIONS.md             # Grill-me session decisions (binding for v1)
├── SPECKIT_AI_WORKFLOW_PROMPTS.md  # Canonical prompt pack for Speckit phases
└── AGENTS.md                       # Runtime guidance for AI agents
```

**Structure Decision**: Monorepo-lite (DESIGN_DECISIONS.md Decision 8). Framework source and app instances cohabitate in one repository at top level. Matches the intelli-park-e2e reference pattern. Framework extraction to a separate npm package is mechanical if needed later (deferred to post-v1).

## Complexity Tracking

> No violations detected. All 10 constitutional principles pass. No complexity justifications required.
