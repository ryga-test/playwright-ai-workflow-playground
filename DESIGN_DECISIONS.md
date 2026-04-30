# Design Decisions — Playwright AI Workflow Playground

Resolved during grill-me session on 2026-04-30. These decisions feed into the Speckit phases as clarifications to the SPECKIT_AI_WORKFLOW_PROMPTS.md prompt pack.

## Decisions

### 1. Speckit Execution Model
**Choice:** Manual copy-paste of each phase prompt into pi, one at a time.

The AI agent (pi) does all the heavy lifting — spec generation, planning, task generation, implementation. Speckit CLI is used only for `specify init --here` to scaffold the project. No Speckit CLI commands beyond that.

### 2. What to Preserve vs Abstract from intelli-park-e2e
**Choice:** Preserve structural patterns, abstract everything domain-specific.

| Preserve (as-is pattern) | Abstract (make generic) |
|---------------------------|------------------------|
| Pipeline step ordering (resolve → discover → draft → write → run/fix → knowledge → summary) | Module slugs → app-agnostic "feature" or "page" identifiers |
| Knowledge file triad (`knowledge.md`, `rules.md`, `hypotheses.md`) | Brand → "target/variant" |
| Approval lock files (`.approval-lock.json` with SHA-256) | `src/pages/ecam/` → `src/pages/<app>/` |
| Capability abstraction (`manifest.yaml` → `capabilities.yaml`) | Component-library knowledge (Ant Design, MUI) → pluggable component adapters |
| Selector priority (`getByRole > getByText > ...`) | eCam-specific navigation → app-agnostic navigation |

### 3. v1 Scope
**Choice:** Full pipeline, single local example app.

All 9 pipeline steps implemented end-to-end against one local example app. No partial pipeline. This forces every capability to work concretely before multi-app abstraction.

### 4. Example App
**Choice:** Local static HTML page.

A mock dashboard with form, table, and navigation elements. Zero external dependencies, zero network flakiness, zero credentials. Served locally via `npx serve` or similar. Doubles as the framework's own demo page.

### 5. Multi-Agent Comparison
**Choice:** Pi-only for MVP.

The framework architecture leaves room for future agents (openCode, Claude, Copilot, etc.) but v1 targets pi exclusively. Multi-agent comparison is deferred.

### 6. Approval Gates
**Choice:** Manual human-in-the-loop via chat review.

- AI agent writes artifact drafts and tells the human "review this file"
- Human reads the file, says "approved" or gives change feedback in chat
- No lock file automation, no SHA-256 hashing, no drift detection in v1
- `.approval-lock.json` schema is defined (from intelli-park-e2e pi adapter spec) so automation can be dropped in later

### 7. Capability Abstraction
**Choice:** Built from day one.

- `workflows/manifest.yaml` — neutral capability definitions (WHAT each step does)
- `adapters/pi/capabilities.yaml` — pi-specific command templates (HOW pi executes it)
- This is the reusable architecture. Not deferred even though v1 is pi-only.

### 8. Project Structure
**Choice:** Monorepo-lite (A).

Framework and app instances cohabitate in one repo at top level:

```
adapters/pi/capabilities.yaml
workflows/manifest.yaml
prompts/
contracts/
apps/example/profile.yaml
src/pages/example/
tests/example/
knowledge/example/
results/example/
```

Matches the reference project pattern. Framework extraction to a separate package is mechanical if needed later.

### 9. Prompt Files
**Choice:** Executable copy-paste templates in `prompts/`.

`prompts/` contains step-level prompt files with `{{module}}`-style placeholders. The human copies, fills in, and pastes each one. The manifest defines WHAT each step does; the prompt templates define HOW to ask the AI to do it.

### 10. Knowledge Files
**Choice:** Start empty, populated by the pipeline run itself.

- `knowledge/example/` files start as empty scaffolding
- Step 1 (discover) captures observations
- Step 5 (knowledge update) writes verified observations back as rules and knowledge
- Proves the full knowledge lifecycle: empty → populated → updated → archived
- `hypotheses.md` and `INDEX.md` skipped for v1, added to schema/contracts for future expansion

### 11. Framework Testing
**Choice:** Implicit — the full pipeline run against the example app is the integration test.

No separate Playwright specs for the framework itself. If all pipeline steps complete and the generated Playwright spec for the example app passes, the framework works.

### 12. Exit Criteria
**Choice:** Items 1, 2, 4, 5, 6, 7.

The framework is "done" when:

1. All 8 Speckit phases (constitution through implement) have produced their artifacts and the implementation compiles/runs
2. The full pipeline runs against the example app end-to-end — all steps complete, generated Playwright spec passes, knowledge files populated
3. `results/example/<run>/` contains all canonical artifacts (snapshot, selectors, page object draft, test draft, spec, run report, pipeline summary)
4. `npm run test` passes (framework's own smoke tests)
5. `npm run lint` and `npm run typecheck` pass
6. Project passes Constitution Check (secrets handling, app isolation, review gates, reproducible artifacts)

**Deferred:** Quickstart usability test (a new human clones and runs the pipeline without guidance).

### 13. TypeScript Quality
**Choice:** Clean TypeScript throughout — strong typing, strict mode, no escape hatches.

- `strict: true` in `tsconfig.json`
- No `any` types without explicit justification
- `npm run typecheck` as a quality gate
- Every framework file (adapters, page objects, fixtures, tests, helpers) is `.ts`, not `.js`
- Strong typing means better tooling (autocomplete, refactoring), fewer runtime bugs, and self-documenting APIs

### 14. Version Control
**Choice:** Disciplined git usage — atomic conventional commits, source-only tracking.

- Atomic commits tied to Speckit phases: `feat(constitution): ...`, `fix(pipeline): ...`
- Never commit secrets, `.env`, storage state, or generated `results/` artifacts
- Git tracks source, not run output
- `results/` is ignored via `.gitignore`
