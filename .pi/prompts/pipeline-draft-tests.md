---
description: (5/8) Draft per-flow GWT test scenarios — GATED, requires human approval
argument-hint: "<app> <run>"
---
⚠️ **GATED STEP — human approval required before proceeding.**

Draft GWT-style test scenarios per selected flow:

1. Read `results/$1/$2/step4-draft-page-object/page-object.draft.ts`.
2. Read `results/$1/$2/step1-resolve/flow-inventory.json` when present.
3. Read each selected source flow YAML and its `goal`, `allowedActions`, `forbiddenActions`, `successCriteria`, `outOfScope`, `notes`, `knowledgeRefs`, and resolved test-data artifact reference.
4. Read `knowledge/$1/knowledge.md`, `knowledge/$1/rules.md`, and `docs/gherkin-guidelines.md` for app context and scenario rules.
5. For each selected flow, generate a separate feature draft at `results/$1/$2/flows/<flow-id>/test-scenarios.feature`.
6. Generate per-flow coverage at `results/$1/$2/flows/<flow-id>/scenario-coverage.md` mapping each scenario or scenario-outline example row to flow success criteria and discovered elements.
7. Also write aggregate review indexes:
   - `results/$1/$2/step5-draft-tests/test-drafts-index.md`
   - `results/$1/$2/step5-draft-tests/scenario-coverage-index.md`
8. Validate before review:
   - one Feature per selected flow
   - at least one Scenario or Scenario Outline per flow
   - Given/When/Then used
   - no CSS/XPath, Playwright locators, page-object method names, or implementation mechanics in Gherkin
   - no forbidden action is included
   - flow source path appears as stable Gherkin provenance comment
9. **Present every per-flow feature draft and coverage summary inline** for human review.
10. **Do NOT proceed to spec writing until the human runs `/pipeline-continue`.**

**Approval flow**:
- Human runs `/pipeline-continue` after review; the pipeline runner sends `approved` to this step → promote each approved feature to `tests/$1/<flow-id>.feature` with Gherkin comment provenance (`# Source-flow`, `# Run-ID`, `# Approved-at`, `# Approved-step: test-draft-review`).
- Human provides feedback in chat instead of running `/pipeline-continue` → re-draft affected flow files incorporating the feedback (max 3 attempts).
- If one flow cannot be approved after 3 attempts, mark that flow failed/blocked and continue other approved flows when safe.
- Draft copies stay in `results/` as immutable run record.
