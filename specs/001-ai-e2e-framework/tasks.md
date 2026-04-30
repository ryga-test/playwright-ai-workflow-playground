# Tasks: Playwright AI E2E Framework

**Input**: Design documents from `specs/001-ai-e2e-framework/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No separate test tasks — the framework's integration test is the full pipeline run against the example app (per DESIGN_DECISIONS.md Decision 11).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root. Structure per plan.md (monorepo-lite):

```
apps/<app>/           adapters/<agent>/     workflows/
src/pages/<app>/      src/fixtures/          src/helpers/
tests/<app>/          knowledge/<app>/       results/<app>/    (gitignored)
contracts/            docs/                  specs/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — npm, TypeScript, Playwright, directory structure

- [X] T001 Create `package.json` with `"type": "module"` and npm scripts: `install`, `typecheck` (`tsc --noEmit`), `lint` (`eslint .` if configured, placeholder otherwise), `test` (`npx playwright test`), `test:headed` (`npx playwright test --headed`), `test:debug` (`npx playwright test --debug`), `report` (`npx playwright show-report`). Dependencies: `@playwright/test` (latest), `typescript`, `dotenv`, `js-yaml`, `@types/js-yaml`. DevDependencies: `@types/node`.
- [X] T002 [P] Create `tsconfig.json` with `strict: true`, `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `esModuleInterop: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`, `resolveJsonModule: true`. Path aliases: `@pages/*` → `src/pages/*`, `@fixtures/*` → `src/fixtures/*`, `@helpers/*` → `src/helpers/*`. Include `src/**/*.ts`, `tests/**/*.ts`, `playwright.config.ts`. Exclude `node_modules`, `results`.
- [X] T003 [P] Create `.env.example` with placeholder values for all known app profiles' env vars. v1 content: `EXAMPLE_BASE_URL=http://localhost:3000`. Add header comment explaining copy-to-`.env` workflow.
- [X] T004 [P] Create `.gitignore` excluding: `.env`, `results/`, `node_modules/`, `*.storage-state.json`, `state/`, `playwright-report/`, `allure-report/`, `allure-results/`, `dist/`, `.cache/`, `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`.
- [X] T005 Run `mkdir -p` to create all directories: `apps/example`, `adapters/pi`, `workflows`, `src/pages/example`, `src/fixtures`, `src/helpers`, `tests/example`, `knowledge/example`, `results`, `contracts`, `docs`. Add `.gitkeep` to `tests/example/` so the empty test dir is tracked (`results/` is gitignored, so no `.gitkeep` needed there).
- [X] T006 Run `npm install` to install all dependencies. Run `npx playwright install chromium` to install Playwright browser. Verify `npm run typecheck` reports zero errors (will fail until source files exist — expected, re-verify after Phase 3).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contracts, app profile, core helpers — MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 [P] Create `apps/example/profile.yaml` following `specs/001-ai-e2e-framework/contracts/profile.schema.yaml`. Required fields only: `name: example`, `baseUrlEnvVar: EXAMPLE_BASE_URL`. No optional fields.
- [X] T008 [P] Create `contracts/profile.schema.yaml` with fields: `name` (required, `[a-z0-9-]+`, unique), `baseUrlEnvVar` (required, `^[A-Z_][A-Z0-9_]*$`), `authMethod` (optional, free-text), `testTags` (optional, string list), `storageStatePath` (optional, path string). Include example and validation rules as YAML comments.
- [X] T009 [P] Create `contracts/manifest.schema.yaml` defining all 8 pipeline steps with `id`, `name`, `order`, `gated` (boolean), `inputs` (array of `{name, path, format}`), `outputs` (array of `{name, path, format}`), `description`. Steps 4 and 5 marked `gated: true`. Use `{{app}}` and `{{run}}` placeholders in paths.
- [X] T010 [P] Create `contracts/adapter.schema.yaml` with `adapter` field and `capabilities` array. Each capability: `step` (references manifest step id), `command_template` (multi-line string with `{{placeholders}}`), optional `gated` flag.
- [X] T011 [P] Create `contracts/approval-lock.schema.yaml` with fields: `runId` (ISO 8601), `gatedStep` (string from manifest), `approvedAt` (ISO 8601), `artifacts` (array of `{path, sha256}`). Add comment noting this schema is defined but not enforced in v1 — provenance headers serve as lightweight alternative.
- [X] T012 Create `src/helpers/profile-loader.ts` exporting `loadProfile(appName: string): AppProfile` function. Reads `apps/<app>/profile.yaml` using `js-yaml`, validates `name` and `baseUrlEnvVar` per contract rules, throws on missing/invalid. Export `AppProfile` interface with required + optional fields.
- [X] T013 [P] Create `src/helpers/artifact-writer.ts` exporting `writeArtifact(app: string, runId: string, step: string, filename: string, content: string): void` function. Creates `results/<app>/<runId>/<step>/` directory if needed, writes file, returns full path. Also export `generateRunId(): string` returning current ISO 8601 UTC timestamp.
- [X] T014 [P] Create `src/helpers/snapshot-parser.ts` exporting `parseSnapshot(yamlContent: string): InteractiveElement[]` function. Parses Playwright ARIA snapshot YAML and extracts interactive elements (buttons, inputs, links, table cells) with their roles, names, and accessible descriptions. Export `InteractiveElement` interface.
- [X] T015 [P] Create `src/fixtures/base.fixture.ts` exporting a Playwright `test` fixture extended with `appConfig` property (loaded from profile) and `baseURL` (from `process.env[config.baseUrlEnvVar]`). Include `axe` or accessibility helpers if desired (optional). Export as `test` and `expect`.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Framework Scaffold with Example App (Priority: P1) 🎯 MVP

**Goal**: A cloned repo installs cleanly, typechecks, and the example app is serveable and Playwright-interactable.

**Independent Test**: `npm install && npm run typecheck` passes with zero errors. Serve `apps/example/index.html` locally, verify form (≥2 inputs + submit), table (≥3 rows × 2 cols), navigation (≥2 links) render and respond to Playwright `page.goto()`, `page.fill()`, `page.click()`.

### Implementation for User Story 1

- [X] T016 [P] [US1] Create `apps/example/index.html` — a static HTML page with: (a) a `<form>` containing at least 2 `<input>` fields (text, email, or password) and a `<button type="submit">` with text "Save Changes", (b) a `<table>` with at least 3 data rows and 2 columns (Name, Status) with sample data, (c) a `<nav>` with at least 2 `<a>` links ("Dashboard", "Settings"). No external CSS/JS dependencies. Use semantic HTML with `role` attributes where helpful for Playwright locators.
- [X] T017 [P] [US1] Create `playwright.config.ts` using `defineConfig`. Set `testDir: './tests'`. Configure a Playwright project per app (v1: one project `example` with `testDir: './tests/example'`). Set `use.baseURL` to read from `process.env` using the profile's `baseUrlEnvVar`. Set `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`, `reporter: [['html', { outputFolder: 'playwright-report' }], ['list']]`. Include `outputDir` pointing to `results/<app>/<run>/test-results/` pattern (use env var or CLI param for run ID). Set `fullyParallel: false`, `workers: 1` for deterministic pipeline execution.
- [X] T018 [P] [US1] Create `src/types/app-profile.ts` with the `AppProfile` TypeScript interface: `name: string`, `baseUrlEnvVar: string`, `authMethod?: string`, `testTags?: string[]`, `storageStatePath?: string`. This is the canonical type reused by `profile-loader.ts` and fixtures.
- [X] T019 [US1] Create `docs/README.md` with: (a) framework overview (what it is, who it's for), (b) prerequisites (Node.js 18+, npm), (c) install steps, (d) how to serve the example app, (e) how to add a new app profile, (f) reference to `specs/001-ai-e2e-framework/quickstart.md` for the full pipeline walkthrough.
- [X] T020 [US1] Verify `npm run typecheck` passes with zero errors across all created `.ts` files. Additionally, verify no file in `src/pages/<app>/`, `tests/<app>/`, or `knowledge/<app>/` imports from another app's directory (cross-app isolation per FR-009b).
- [X] T021 [US1] Verify example app: serve `apps/example/` on port 3000, write a manual check that all elements render, or run `npx playwright open http://localhost:3000` to visually confirm.

**Checkpoint**: Framework scaffold complete — `npm install && npm run typecheck` green, example app serveable and interactive.

---

## Phase 4: User Story 2 — Pipeline Workflow Architecture (Priority: P2)

**Goal**: `workflows/manifest.yaml` defines all 8 steps. `adapters/pi/capabilities.yaml` maps every capability to a pi command template. The adapter schema supports a second agent without manifest changes.

**Independent Test**: Read `workflows/manifest.yaml` and verify 8 steps (resolve, discover, extract-selectors, draft-page-object, draft-tests, write-spec, run-fix, summarize) with correct gating (only steps 4 and 5 gated). Read `adapters/pi/capabilities.yaml` and verify every manifest step has a `command_template`. Verify adapter schema matches `contracts/adapter.schema.yaml`.

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create `workflows/manifest.yaml` per `contracts/manifest.schema.yaml`. Define all 8 steps with exact `{{app}}` and `{{run}}` placeholders in paths. Use the YAML content from `specs/001-ai-e2e-framework/contracts/manifest.schema.yaml` as the canonical source — copy and remove the schema commentary, keeping only the YAML data.
- [ ] T023 [P] [US2] Create `adapters/pi/capabilities.yaml` per `contracts/adapter.schema.yaml`. Define `adapter: pi` and 8 capability entries, each with `step` matching manifest ids and `command_template` containing the step instructions. Use the content from `specs/001-ai-e2e-framework/contracts/adapter.schema.yaml` as source. Steps 4 and 5 MUST include `gated: true` and instructions for presenting drafts for human review.
- [ ] T024 [US2] Create `adapters/pi/README.md` documenting: (a) how pi slash commands map to pipeline steps, (b) how to invoke each step (`/pipeline-resolve example`, `/pipeline-discover example <run>`, etc.), (c) how placeholders (`{{app}}`, `{{run}}`) are resolved, (d) the gated step flow (approve/re-draft), (e) how to add a second adapter at `adapters/<agent>/capabilities.yaml`.
- [ ] T025 [US2] Verify manifest completeness: confirm 8 steps, confirm steps 4 and 5 have `gated: true`, confirm all paths use `{{app}}` and `{{run}}` placeholders consistently. Confirm adapter maps all 8 steps with no unmapped capabilities.
- [ ] T026 [US2] Verify adapter extensibility: confirm `contracts/adapter.schema.yaml` requires only `adapter` name + `capabilities` array. Confirm a hypothetical `adapters/claude/capabilities.yaml` could be added without editing `workflows/manifest.yaml` (verifiable by reading manifest — it has no agent-specific references).

**Checkpoint**: Pipeline architecture complete — manifest and pi adapter are self-consistent, extensible.

---

## Phase 5: User Story 3 — End-to-End Pipeline Run Against Example App (Priority: P3)

**Goal**: All 8 pipeline slash commands execute against the example app, producing passing Playwright specs with populated knowledge files and canonical `results/` artifacts.

**Independent Test**: Invoke all 8 pipeline steps via pi slash commands against a locally served example app. Verify `results/example/<run>/step-*/` contains all 7 artifact types. Run `npx playwright test tests/example/` and confirm all generated tests pass.

### Knowledge Scaffolding

- [ ] T027 [P] [US3] Create `knowledge/example/knowledge.md` with a `# Knowledge: example` heading, a `## Human-Curated` section (empty), and a comment noting that pipeline runs append observations under `## Run <run-id>` headings.
- [ ] T028 [P] [US3] Create `knowledge/example/rules.md` with a `# Rules: example` heading, a `## Human-Curated` section (empty), and the same append-only convention comment.
- [ ] T029 [P] [US3] Create `knowledge/example/selector-notes.md` with a `# Selector Notes: example` heading, a `## Locator Priority` section documenting the constitutional locator order (role → testid → label → placeholder → text → CSS/XPath), and an empty `## Findings` section.

### Playwright Test Infrastructure

- [ ] T030 [US3] Create `src/pages/example/` directory with `.gitkeep`. This is where approved page objects will be promoted. Create a `src/pages/example/README.md` explaining the page object convention: one file per page/section, class per file, locators as private readonly properties, methods for user actions.
- [ ] T031 [US3] Update `playwright.config.ts` to support the `--grep` or project selection pattern so `npx playwright test tests/example/` runs only example app tests. Ensure `outputDir` is configurable for pipeline runs (the pipeline step sets the run ID).
- [ ] T032 [US3] Configure Playwright HTML reporter storage: ensure `playwright-report/` folder is gitignored. Add `npm run report` script (`npx playwright show-report`) to `package.json` if not already present from T001.

### Pipeline Step Execution (via pi slash commands in capabilities.yaml)

Each step below is invoked as a pi slash command. The `command_template` in `adapters/pi/capabilities.yaml` provides the instructions. These tasks verify each step's output artifacts are correctly produced.

- [ ] T033 [US3] **Step 1 (Resolve)**: Run `/pipeline-resolve example`. Verify output: `results/example/<run>/step1-resolve/run-metadata.json` exists and contains `app: "example"`, `runId` (ISO 8601 timestamp), `baseUrl` from `.env`, profile validation status. Verify the resolve step detects missing `.env` variables and reports them clearly (test by temporarily removing `EXAMPLE_BASE_URL`).
- [ ] T034 [US3] **Step 2 (Discover)**: Run `/pipeline-discover example <run>` against a running example app on localhost:3000. Verify output: `results/example/<run>/step2-discover/snapshot.yaml` contains Playwright ARIA snapshot with all interactive elements from the example app. `results/example/<run>/step2-discover/selector-candidates.md` lists selector candidates with locator types. Verify the step fails gracefully (writes error artifact, does not crash) if the app is not reachable.
- [ ] T035 [US3] **Step 3 (Extract Selectors)**: Run `/pipeline-extract-selectors example <run>`. Verify output: `results/example/<run>/step3-extract-selectors/normalized-selectors.md` contains selectors annotated with Playwright locator priority levels (e.g., `role=button[name="Save Changes"]`, `text=Dashboard`). Verify brittle selectors (CSS, XPath) carry justification comments.
- [ ] T036 [US3] **Step 4 (Draft Page Object) ⚠️ GATED**: Run `/pipeline-draft-page-object example <run>`. Verify output: `results/example/<run>/step4-draft-page-object/page-object.draft.ts` is valid TypeScript using `@playwright/test` `Page` class. Verify the AI presents the draft for human review and does NOT write to `src/pages/example/` until approval. On approval (`approved`), verify: (a) file promoted to `src/pages/example/example.page.ts`, (b) provenance header comment present: `// @provenance runId=<run> approvedAt=<ISO> gate=page-object-review`, (c) draft retained in `results/`. On rejection with feedback, verify re-draft occurs (max 3 attempts) with feedback incorporated.
- [ ] T037 [US3] **Step 5 (Draft Tests) ⚠️ GATED**: Run `/pipeline-draft-tests example <run>`. Verify output: `results/example/<run>/step5-draft-tests/test-draft.md` contains GWT-style scenarios covering the example app's form, table, and navigation. Verify the AI presents for review and does NOT proceed to spec writing until approval. On approval: `results/example/<run>/step5-draft-tests/test-draft.md` marked as approved. On rejection: re-draft loop same as Step 4.
- [ ] T038 [US3] **Step 6 (Write Spec)**: Run `/pipeline-write-spec example <run>` (only after both gates approved). Verify output: `tests/example/example.spec.ts` is valid TypeScript, imports from `src/pages/example/example.page.ts`, uses `@playwright/test`, and compiles via `npm run typecheck`. Verify provenance header present: `// @provenance runId=<run> approvedAt=<ISO> gate=test-draft-review`.
- [ ] T039 [US3] **Overwrite Detection**: Run `/pipeline-write-spec example <new-run>` a second time (simulating a subsequent pipeline run). Verify the AI detects the existing provenance header in `tests/example/example.spec.ts`, presents a diff of proposed changes, and requests re-approval before writing. Verify the provenance header is updated with the new run ID on re-approval.
- [ ] T040 [US3] **Step 7 (Run/Fix)**: Run `/pipeline-run-fix example <run>`. Verify: `npx playwright test tests/example/` executes, failures are triaged (script_bug vs app_bug), script bugs are fixed and tests re-run. Verify output: `results/example/<run>/step7-run-fix/test-report.md` with pass/fail/triage per test, `results/example/<run>/step7-run-fix/playwright-report/` contains HTML report, `results/example/<run>/step7-run-fix/traces/` contains trace files for failing tests.
- [ ] T041 [US3] **Step 8 (Summarize)**: Run `/pipeline-summarize example <run>`. Verify output: `results/example/<run>/pipeline-summary.md` summarizes all 8 step outcomes. Verify `knowledge/example/knowledge.md` has new `## Run <run-id>` section with verified observations (not duplicated from prior runs). Verify `knowledge/example/rules.md` has new rules under `## Run <run-id>`. Verify human-curated content and previous run sections are NOT modified.
- [ ] T042 [US3] **Full Pipeline E2E**: Execute all 8 steps sequentially against a fresh run. Verify: all steps complete, `npm run typecheck` passes, `npx playwright test tests/example/` passes with zero failures, all 7 artifact types present in `results/example/<run>/`, knowledge files populated, pipeline summary complete.

**Checkpoint**: Full pipeline E2E working — generated tests pass, knowledge files populated, artifacts canonical.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, documentation, extensibility verification

- [ ] T043 [P] Verify `.gitignore` coverage: confirm `git status` shows no `.env`, `results/`, `node_modules/`, storage state files, or report folders as untracked. Run `git status --short` after Phase 5 to ensure only source files appear.
- [ ] T044 [P] Verify `npm run typecheck` covers all `.ts` files in `src/`, `tests/`, and `playwright.config.ts`. Run `npm run typecheck` and confirm zero errors.
- [ ] T045 [P] Verify `npm run lint` configuration: if ESLint is not yet configured, add a placeholder `npm run lint` script that prints "ESLint not configured — skipping" with exit code 0 (so the CI/quality gate script doesn't break). If time permits, add `.eslintrc.json` with `@typescript-eslint` recommended rules.
- [ ] T046 [P] Verify `npm scripts` completeness: `npm run test` → runs `npx playwright test`, `npm run test:headed` → runs headed, `npm run test:debug` → runs with `--debug`, `npm run report` → shows HTML report. Test each script.
- [ ] T047 Verify knowledge file structure: open `knowledge/example/knowledge.md`, confirm it uses `## Run <run-id>` headings and `## Human-Curated` section. Verify no duplicate observations. Verify the file documents how to reserve `hypotheses.md` slot for future use (comment in file header per FR-027).
- [ ] T048 Verify provenance headers: open `src/pages/example/example.page.ts` and `tests/example/example.spec.ts`, confirm each has `// @provenance runId=... approvedAt=... gate=...` header. Verify headers are parseable (consistent format, ISO 8601 timestamps).
- [ ] T049 Verify adapter extensibility: confirm `adapters/pi/capabilities.yaml` structure matches `contracts/adapter.schema.yaml`. Document in `adapters/pi/README.md` the exact steps to add a `adapters/claude/capabilities.yaml`. Confirm no changes to `workflows/manifest.yaml` would be needed.
- [ ] T050 Run quickstart validation: execute the steps in `specs/001-ai-e2e-framework/quickstart.md` from a clean state. Verify all commands succeed, timing matches SC estimates (install <2 min, profile <10 min, full run <30 min per SC-008).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (needs npm, tsconfig, dirs)
- **US1 (Phase 3)**: Depends on Foundational (needs profile-loader, artifact-writer, base fixture)
- **US2 (Phase 4)**: Depends on Foundational (needs contracts as reference schemas)
- **US3 (Phase 5)**: Depends on US1 (needs example app, playwright config) AND US2 (needs manifest, adapter capabilities)
- **Polish (Phase 6)**: Depends on US3 completion (needs pipeline artifacts to verify)

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on US2 or US3
- **US2 (P2)**: Can start after Foundational — no dependencies on US1 or US3. Can run in parallel with US1.
- **US3 (P3)**: Depends on US1 (example app, playwright config) AND US2 (manifest, capabilities). Must wait for both.

### Within Each Phase

- All [P] tasks can run in parallel (different files, no shared state)
- Non-[P] tasks run sequentially within the phase
- Each phase has a checkpoint task that depends on all tasks in that phase

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 all touch different files → run in parallel
- **Phase 2**: T007–T011 all touch different files → run in parallel. T012–T015 all touch different files → run in parallel.
- **Phase 3 (US1)**: T016, T017, T018 touch different files → run in parallel
- **Phase 4 (US2)**: T022, T023 touch different files → run in parallel
- **Phase 5 (US3)**: T027, T028, T029 (knowledge scaffolding) → run in parallel. T030, T031, T032 (test infrastructure) → run in parallel.
- **Phase 6**: T043, T044, T045, T046 → run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all contracts in parallel (different files):
Task: "Create apps/example/profile.yaml"
Task: "Create contracts/profile.schema.yaml"
Task: "Create contracts/manifest.schema.yaml"
Task: "Create contracts/adapter.schema.yaml"
Task: "Create contracts/approval-lock.schema.yaml"

# Launch all helpers in parallel (different files):
Task: "Create src/helpers/profile-loader.ts"
Task: "Create src/helpers/artifact-writer.ts"
Task: "Create src/helpers/snapshot-parser.ts"
Task: "Create src/fixtures/base.fixture.ts"
```

## Parallel Example: Phase 3 (US1)

```bash
# Launch together (different files):
Task: "Create apps/example/index.html in apps/example/index.html"
Task: "Create playwright.config.ts"
Task: "Create src/types/app-profile.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Framework Scaffold)
4. **STOP and VALIDATE**: `npm install && npm run typecheck` passes, example app serves and is interactive
5. Framework is installable and example app is usable — baseline deliverable

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Framework installable, example app functional (MVP!)
3. Add US2 → Pipeline architecture defined, pi adapter ready
4. Add US3 → Full pipeline E2E against example app → generated tests pass
5. Polish → Quality gates, docs, extensibility verified

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Framework Scaffold) — T016–T021
   - Developer B: US2 (Pipeline Architecture) — T022–T026
3. Once US1 AND US2 are done:
   - Developer A + B: US3 (E2E Pipeline Run) — T027–T042 (steps can be split: A takes steps 1-4, B takes steps 5-8)
4. Both: Polish — T043–T050

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable per spec acceptance scenarios
- Pipeline steps 4 and 5 (gated) require human interaction during execution — not automatable
- No `prompts/` directory — commands live in `adapters/pi/capabilities.yaml` (clarification Q1)
- All artifacts are text-based (YAML, Markdown, TypeScript) — no binary-only formats per FR-017
- `results/` is gitignored — verify via T043
- Commit after each logical group, using conventional commit format (Principle X)
- See `DESIGN_DECISIONS.md` for v1 scope boundaries
