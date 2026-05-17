---
description: (6/8) Generate per-flow Playwright specs from approved artifacts
argument-hint: "<app> <run>"
---
Write Playwright specs after both review gates are approved:

1. Read `results/$1/flows/<flow-id>/$2/step1-resolve/flow-inventory.json` to determine the selected flow.
2. Read the approved feature file from `tests/$1/<flow-id>.feature`.
3. Read coverage from `results/$1/flows/<flow-id>/$2/scenario-coverage.md`.
4. Read the approved shared page object from `src/pages/$1/$1.page.ts`.
5. Re-validate the approved feature and coverage mapping; stop or mark the flow blocked if invalid or if any scenario/example row lacks coverage mapping.
6. Generate one Playwright spec for the approved flow at `tests/$1/<flow-id>.spec.ts`.
7. Each generated spec must:
   - import `test` and `expect` from `@fixtures/base.fixture.js`
   - import the shared page object
   - use one generated test per approved Scenario or Scenario Outline example row
   - preserve traceability in test titles/comments
   - append allowed Gherkin tags to Playwright test titles
   - use helpers for resolved test-data strategies rather than embedding stale dates; e.g. relative dates use test-data helpers and synthetic emails use test-data helpers
   - include comments indicating which helper/literal came from which flow `testData` field
8. If the target spec already exists, write the proposed diff to `results/$1/flows/<flow-id>/$2/spec.diff`.
9. Overwrite the spec automatically after Step 5 approval; do not request another human approval in Step 6.
10. Add/update provenance header: `// @provenance runId=$2 approvedAt=<now> gate=test-draft-review source=tests/$1/<flow-id>.feature flow=apps/$1/flows/<flow-id>.yaml`.
11. Run `npm run typecheck` to verify compilation and fix errors before declaring step complete.

Do not use legacy app-level mode for pipeline runs; a selected `FLOW_ID` is required.
