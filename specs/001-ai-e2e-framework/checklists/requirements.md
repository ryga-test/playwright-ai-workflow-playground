# Requirements Quality Checklist: Playwright AI E2E Framework

**Purpose**: Validate that the feature specification requirements are complete, unambiguous, consistent, and implementation-ready across all critical domains.
**Created**: 2026-04-30
**Updated**: 2026-04-30 (all gaps resolved)
**Feature**: [spec.md](../spec.md)

## Multi-Application Isolation

- [x] CHK001 — Are per-app directory isolation requirements explicitly defined for page objects (`src/pages/<app>/`), tests (`tests/<app>/`), and fixtures beyond the result and knowledge directories? [Completeness — Resolved: directory convention is explicit in FR-006/FR-009/FR-020 paths, fixtures implied by FR-002 path aliases]
- [x] CHK002 — Is there a requirement preventing one application's configuration (base URL, auth method, env vars) from leaking into another application's pipeline run? [Completeness — Resolved: FR-009b explicitly forbids cross-app data leakage]
- [x] CHK003 — Are the naming rules for app slugs (used in directory paths like `apps/<app>/`, `results/<app>/`) specified with character constraints or uniqueness rules? [Clarity — Resolved: FR-009a specifies `[a-z0-9-]+` and uniqueness]
- [x] CHK004 — Does the spec define how a pipeline run selects which app profile to use, and what happens when multiple profiles exist? [Completeness — Resolved: FR-009b — resolve-inputs step selects via user-provided or defaulted slug]

## AI Workflow Artifact Lifecycle

- [x] CHK005 — Is the full lifecycle of a pipeline artifact defined: creation → draft storage → human review → promotion → post-promotion retention? [Completeness — Resolved: FR-017 requires draft artifacts retained in results/ after promotion as immutable record]
- [x] CHK006 — Are requirements specified for what happens to draft artifacts after they are promoted to source directories (retained, archived, or deleted)? [Completeness — Resolved: FR-017 — drafts retained in results/ as immutable run record]
- [x] CHK007 — Is the format of each artifact type (UI snapshot, selector candidates, page object draft, test draft, spec, report, summary) specified or constrained? [Clarity — Resolved: FR-017 specifies format per artifact type (YAML for snapshot, Markdown for selectors, TypeScript for page objects/specs, GWT Markdown for drafts)]
- [x] CHK008 — Does the spec define how a subsequent pipeline run detects that artifacts from a previous run already exist and how it avoids silent overwrites? [Completeness — Resolved: FR-016 — ISO timestamp run IDs guarantee uniqueness + pre-write existence check]

## Human Review / Approval Gates

- [x] CHK009 — Are the specific pipeline steps that require human approval (gated steps) explicitly listed in the functional requirements? [Completeness — Resolved: FR-020 lists both gated steps: draft page object and draft tests]
- [x] CHK010 — Is the exact mechanism for a human to signal "approved" specified unambiguously? [Clarity — Resolved: FR-021 requires the exact word "approved"]
- [x] CHK011 — Is the rejection/re-draft loop formally specified: maximum re-draft attempts, how rejection reasons propagate, and what happens if no convergence? [Completeness — Resolved: FR-021 — max 3 re-drafts, blocked state with unresolved feedback recorded]
- [x] CHK012 — Are requirements defined for what the AI agent must present to the human during review? [Clarity — Resolved: FR-021 — full draft artifact text inline in chat session]

## Promotion Rules for Generated Artifacts

- [x] CHK013 — Are the exact source directories where approved page objects and tests are promoted to defined in functional requirements? [Clarity — Resolved: FR-020 specifies `src/pages/<app>/` and `tests/<app>/`]
- [x] CHK014 — Is there a requirement that promotion must preserve or record the provenance of the artifact? [Completeness — Resolved: FR-021a — provenance header with run ID, timestamp, approving step]
- [x] CHK015 — Does the spec define what "noting the change" means when a subsequent run would overwrite an approved artifact? [Clarity — Resolved: FR-022 — page-object overwrites require re-approval; Step 6 spec overwrites are automatic after Step 5 approval and record a diff artifact]
- [x] CHK016 — Are selector candidate lists subject to the same promotion rules as page objects and test drafts? [Consistency — Resolved: FR-020 explicitly states selectors are NOT gated, remain in results/ as reference]

## Secrets Handling

- [x] CHK017 — Is there a requirement that `.env.example` must document ALL environment variables across ALL app profiles? [Completeness — Resolved: FR-004 requires all known app profiles' variables]
- [x] CHK018 — Does the spec define what constitutes a "secret" beyond credentials? [Clarity — Resolved: FR-004 defines secret scope: credentials, tokens, cookies, session tokens, storage state, internal URLs, PII]
- [x] CHK019 — Is there a requirement for what the framework must do if it detects real secrets in tracked files? [Completeness — Resolved: .gitignore (FR-005) is the primary defense; pre-commit hooks are a planning/implementation concern beyond spec scope]
- [x] CHK020 — Are storage state file naming conventions and expected locations specified? [Clarity — Resolved: FR-005 specifies `*.storage-state.json` and `state/` patterns, referenced by env vars only]

## Playwright Run / Report Expectations

- [x] CHK021 — Are Playwright report format expectations specified as functional requirements? [Completeness — Resolved: FR-026 requires HTML report, traces, and screenshots]
- [x] CHK022 — Is there a requirement that test traces and screenshots must be stored under `results/<app>/<run>/`? [Completeness — Resolved: FR-026 — all report artifacts stored under `results/<app>/<run>/step5-run-fix/`]
- [x] CHK023 — Does the spec define what test result artifacts must be produced on failure vs success? [Clarity — Resolved: FR-026 — trace+screenshot mandatory on failure, trace optional on success]
- [x] CHK024 — Is the test execution command consistent with per-app test directory isolation? [Consistency — Resolved: FR-024 uses `npx playwright test tests/<app>/` with per-app path]

## Knowledge Update Expectations

- [x] CHK025 — Is the distinction between "verified observations" and "human-curated content" defined with criteria? [Clarity — Resolved: FR-019 — "verified" = used in passing Playwright test during same run]
- [x] CHK026 — Are requirements specified for how the knowledge update step distinguishes new observations from existing content? [Completeness — Resolved: FR-019 — append under `## Run <run-id>` heading, no duplication of prior observations]
- [x] CHK027 — Does the spec define the relationship between knowledge files? [Clarity — Resolved: FR-018 — knowledge.md and rules.md feed into each other; selector-notes.md is selector-specific]
- [x] CHK028 — Is there a requirement for knowledge files to be human-editable after pipeline runs? [Completeness — Resolved: FR-019 — human-curated content preserved; agent appends under run headings, never deletes]

## MVP Boundaries

- [x] CHK029 — Is the v1 MVP scope explicitly stated within the spec itself? [Completeness — Resolved: MVP Scope section added with boundary and deferred items]
- [x] CHK030 — Are the three user stories (P1, P2, P3) explicitly mapped to an MVP boundary? [Clarity — Resolved: MVP Scope states "P1 + P2 + P3 constitute the full v1 deliverable"]
- [x] CHK031 — Does the spec state what is explicitly OUT of scope for v1 within its own body? [Completeness — Resolved: MVP Scope lists 6 deferred items]
- [x] CHK032 — Is there a requirement that the framework must remain extensible for deferred features without architectural changes? [Completeness — Resolved: FR-027 requires adapter schema extensibility + hypotheses.md slot]

## Measurable Success Criteria

- [x] CHK033 — Is SC-003 ("fully interactive") measurable? [Measurability — Resolved: quantified with minimum element counts (2 inputs, 3 table rows × 2 cols, 2 nav links) + Playwright-interaction verifiability]
- [x] CHK034 — Is SC-005 ("structurally comparable pipeline artifacts") measurable? [Measurability — Resolved: 3 specific criteria: same 7 artifact files at same paths, same locator priority order, same interactive element coverage]
- [x] CHK035 — Can SC-008 ("without asking for help") be objectively measured? [Measurability — Resolved: quantified as 30-minute timebox, documentation-only (no external help/DESIGN_DECISIONS.md)]
- [x] CHK036 — Are there success criteria for the two gated review steps specifically? [Completeness — Resolved: SC-006a — ≤1 re-draft cycle per gated artifact, 80% of pipeline runs]

## Requirement Consistency

- [x] CHK037 — Do the 8 pipeline steps listed in FR-010 match the acceptance scenarios across all three user stories? [Consistency — Resolved: verified — resolve inputs, discover UI, extract selectors, draft page object, draft tests, write spec, run/fix tests, summarize/knowledge update match across FR-010, US2 scenario 1, US3 scenarios]
- [x] CHK038 — Is the term "promotion" used consistently? [Consistency — Resolved: "promotion" always means `results/` → `src/pages/<app>/` or `tests/<app>/`; FR-020, FR-021a, FR-022 all consistent]
- [x] CHK039 — Are knowledge file names consistent across FR-018 and KnowledgeEntry entity? [Consistency — Resolved: FR-018: knowledge.md/rules.md/selector-notes.md; KnowledgeEntry: knowledge/rules/selector-notes — consistent]
- [x] CHK040 — Does the adapter architecture remain internally consistent after removal of `prompts/` directory? [Consistency — Resolved: FR-013 (command_template), FR-014 (slash commands), FR-015 (adapter schema) all reference capabilities.yaml only, no prompts/ references remain]

## Dependencies & Assumptions Validation

- [x] CHK041 — Are all 9 assumptions testable before implementation? [Completeness — Resolved: all 9 assumptions are verifiable (pi-only by adapter count, static HTML by page inspection, slash commands by capabilities.yaml, chat review by FR-021 format, empty knowledge by file contents, no test suite by package.json scripts, strict TS by tsconfig.json, secrets by .env.example, @playwright/test by package.json)]
- [x] CHK042 — Does the assumption "no separate Playwright test suite" conflict with SC-001's typecheck expectation? [Conflict — Resolved: assumption clarified — "no separate test suite" means no tests against framework internals; typecheck validates source correctness without executing framework tests]
- [x] CHK043 — Is the dependency on `@playwright/test` explicitly captured? [Completeness — Resolved: added as explicit assumption — hard dependency per constitutional Principle II]
