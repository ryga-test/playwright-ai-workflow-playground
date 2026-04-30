# Research: Playwright AI E2E Framework

**Feature**: `001-ai-e2e-framework`
**Date**: 2026-04-30
**Status**: Complete

## 1. Project Structure: Monorepo-Lite

**Decision**: Single repository with top-level app isolation (monorepo-lite) per DESIGN_DECISIONS.md Decision 8.

**Rationale**: The intelli-park-e2e reference project uses a flat structure where framework code and app instances cohabitate. This avoids premature abstraction (extracting a separate framework package) while keeping apps isolated via directory convention (`apps/<app>/`, `src/pages/<app>/`, `tests/<app>/`, `knowledge/<app>/`, `results/<app>/`). Extraction to a standalone npm package is mechanical if needed later.

**Alternatives considered**:
- **Separate framework + app repos**: Premature for v1. Adds inter-repo dependency management with no benefit until multiple consumers exist.
- **Nested monorepo (npm workspaces)**: Overkill for single-example-app v1. Workspaces add package.json sprawl for no gain.

## 2. Manifest → Adapter Architecture

**Decision**: Three-layer architecture: `workflows/manifest.yaml` (neutral capability definitions) → `adapters/<agent>/capabilities.yaml` (agent-specific command templates) → pi slash command invocation.

**Rationale**: The framework's purpose is AI agent comparison. The manifest defines WHAT each pipeline step does in agent-agnostic terms. Each adapter maps those capabilities to agent-specific commands. This separation means adding a second agent (e.g., Claude) requires only a new `adapters/claude/capabilities.yaml` — no manifest or source changes (FR-015, FR-027).

**Alternatives considered**:
- **Standalone prompt files**: Rejected by clarification Q1. Slash-command wrappers mirror intelli-park-e2e pattern and integrate directly with the pi agent session.
- **Single capabilities.yaml with multi-agent sections**: Violates adapter isolation. Multiple adapters in one file create merge conflicts when agents are developed independently.
- **Code-based pipeline (TypeScript orchestrator)**: Adds unnecessary complexity. v1 uses manual slash-command invocation; orchestration is deferred to post-v1.

## 3. Configuration Format: YAML

**Decision**: All configuration, manifests, and adapter definitions use YAML.

**Rationale**: YAML is human-readable, widely supported in both Node.js (`js-yaml`) and AI tooling, and is the established format in both the reference project and Playwright ecosystem. It supports comments (unlike JSON) and nested structures naturally.

**Alternatives considered**:
- **JSON**: Lacks comments, which are essential for documenting app profiles and capability templates.
- **TOML**: Less familiar in the Node/Playwright ecosystem.
- **TypeScript config files**: Code-as-config introduces execution risk (import side effects, TypeScript compilation dependency for config loading).

## 4. Artifact Formats: Text-Only

**Decision**: All pipeline artifacts use text-based formats — YAML (ARIA snapshots, schemas), Markdown (selector lists, test drafts, run reports, pipeline summaries, knowledge files), TypeScript (page objects, specs). No binary-only or opaque formats (FR-017).

**Rationale**: Text formats are diffable, grep-able, human-readable, and work with Git. This supports the "auditable" requirement (spec FRs) and the "deterministic enough to compare agents" goal (SC-005). AI agents produce and consume text natively — binary formats would require serialization/deserialization layers that introduce variability.

**Alternatives considered**:
- **JSON for artifacts**: Less readable for human review. Markdown is preferred for anything a human must read (selector notes, test drafts, reports).
- **Playwright trace (binary)**: Traces are inherently binary and are the only exception. They're stored alongside Markdown reports and referenced, not used as primary artifacts.

## 5. Run ID Format: ISO 8601 Timestamps

**Decision**: Run identifiers use ISO 8601 UTC timestamps (`YYYY-MM-DDTHHMMSSZ`).

**Rationale**: Guarantees uniqueness without coordination, provides natural sortability (ls lists chronologically), and embeds the creation time in the identifier itself. Simpler than UUIDs (no lookup needed to find when a run happened) and avoids collision issues of sequential numbering when multiple users run pipelines.

**Alternatives considered**:
- **UUID v4**: Unique but opaque — impossible to identify a run by looking at its directory name.
- **Sequential numbering (run-001, run-002)**: Collision-prone in multi-user or multi-branch scenarios. Requires coordination.
- **User-provided slug**: Convenience option, but no guarantee of uniqueness. Timestamps are the canonical format.

## 6. Example App: Local Static HTML

**Decision**: A single `apps/example/index.html` with a mock dashboard containing a form (≥2 inputs + submit), a data table (≥3 rows × 2 columns), and navigation (≥2 links). Served via `npx serve` or similar. Zero external dependencies, zero credentials (DESIGN_DECISIONS.md Decision 4).

**Rationale**: Eliminates network flakiness, authentication complexity, and external service dependencies from v1 testing. Every pipeline capability can be exercised against a deterministic, local target. Doubles as the framework's own demo page.

**Alternatives considered**:
- **Real public website (e.g., Wikipedia)**: Introduces network dependency, rate limiting risk, and potential DOM changes that break deterministic comparisons.
- **Playwright's built-in demo pages**: Not controllable (can't add specific elements to test).
- **Dockerized app**: Overkill for a single static page. Adds Docker as a prerequisite.

## 7. TypeScript Module System: ESM

**Decision**: Use ES modules (`"type": "module"` in package.json) with `.ts` extensions and `ES2022` target.

**Rationale**: ESM is the modern Node.js standard. Playwright's own documentation and examples increasingly favor ESM. Path aliases (`@pages/*`, `@fixtures/*`, `@helpers/*`) work cleanly with ESM via `tsconfig.json` `paths` + `tsx` or `ts-node/esm`. The reference project uses CommonJS, but ESM is forward-looking and avoids CJS/ESM interop issues with newer packages.

**Alternatives considered**:
- **CommonJS (`"type": "commonjs"`)**: Legacy. The reference project uses it but CJS is increasingly treated as deprecated in the Node ecosystem.
- **Hybrid**: Complexity not justified for v1. Pick one and stay consistent.

## 8. No Separate Framework Test Suite

**Decision**: The framework has no standalone Playwright test suite for its own source code. The full pipeline run against the example app serves as the integration test (DESIGN_DECISIONS.md Decision 11, assumption §6).

**Rationale**: The framework's value is in the pipeline working end-to-end. If all 8 steps complete and the generated spec passes against the example app, the framework works. A separate test suite would test framework internals in isolation, but the pipeline run already exercises every component. `npm run typecheck` validates TypeScript correctness across all framework source files (SC-001).

## 9. Approval Lock Schema: Defined but Not Enforced in v1

**Decision**: Define `.approval-lock.json` schema in `contracts/approval-lock.schema.yaml` with fields: `runId`, `gatedStep`, `approvedAt` (ISO 8601), `artifacts` (array of `{ path, sha256 }`). The schema exists for future automated drift detection; v1 uses manual chat-based approval only (DESIGN_DECISIONS.md Decision 6).

**Rationale**: Defining the schema now ensures the data model is ready when lock file automation is added post-v1. The provenance header (FR-021a) serves as the v1 lightweight alternative — it's embedded in the artifact itself, requires no external file, and is machine-readable for future drift detection.

## 10. Knowledge File Lifecycle: Append-Only Under Run Headings

**Decision**: Knowledge files use Markdown with `## Run <run-id>` section headings. The pipeline appends verified observations under a new heading for each run, never modifying or deleting content under previous run headings or human-authored sections (FR-019).

**Rationale**: Prevents data loss from pipeline errors. Human-curated content (added manually between runs) is preserved. The heading convention makes it trivial to see which observations came from which run. Duplicate detection (FR-019) prevents the same observation from being recorded twice across runs.

**Alternatives considered**:
- **Database (SQLite)**: Overkill for knowledge that is fundamentally document-oriented. Markdown is directly human-readable and diffable.
- **Overwrite mode**: Risky — a buggy pipeline run could erase valuable observations from a previous successful run.
- **Separate file per run**: Fragmenting knowledge across dozens of files defeats the purpose of accumulating durable knowledge.

## 11. Playwright Config: Per-App Test Dirs via Projects

**Decision**: `playwright.config.ts` uses Playwright projects to isolate per-app test directories. Each app gets a project entry with its own `testDir` and optional `storageState`. The `baseURL` is resolved from environment variables referenced in the app profile.

**Rationale**: Playwright projects are the idiomatic way to run different test suites with different configurations. This avoids shell-script wrapper complexity (the reference project uses BRAND env vars with shell scripts — we use projects instead for better IDE integration and `npx playwright test --project=example` ergonomics).

**Alternatives considered**:
- **Shell scripts wrapping `npx playwright test` with env vars**: The reference project approach. Works but loses IDE test runner integration and requires remembering script names.
- **Separate `playwright.config.ts` per app**: Creates config duplication. Projects keep a single config file.

## 12. Dependency Choices

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `@playwright/test` | ^1.52 (latest stable) | E2E test framework (constitutional hard dependency) |
| `typescript` | ^5.x | Type checking, compilation |
| `dotenv` | ^17.x | Load `.env` into `process.env` |
| `js-yaml` | ^4.x | Parse YAML profiles, manifest, adapters |
| `@types/js-yaml` | ^4.x | TypeScript types for js-yaml |
| `tsx` | ^4.x | Execute TypeScript without compilation step (scripts, helpers) |

No runtime framework dependencies beyond these. The framework is configuration + conventions + adapter patterns, not a library with an API surface.
