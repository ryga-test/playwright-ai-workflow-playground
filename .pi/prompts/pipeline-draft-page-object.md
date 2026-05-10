---
description: (4/8) Draft shared TypeScript page object — GATED, requires human approval
argument-hint: "<app> <run>"
---
⚠️ **GATED STEP — human approval required before promotion.**

Draft one shared app-level TypeScript page object:

1. Read `results/$1/$2/step3-extract-selectors/normalized-selectors.md`.
2. Read `results/$1/$2/step1-resolve/flow-inventory.json` when present to understand selected flows and start paths.
3. Generate a TypeScript page object class using `@playwright/test` `Page`.
4. Keep the page object shared at app level, not per flow.
5. Include locators and methods needed by all selected flows; preserve path/flow provenance in comments where useful.
6. Use normalized selectors with proper locator methods (`getByRole`, `getByLabel`, etc.).
7. Write the draft to `results/$1/$2/step4-draft-page-object/page-object.draft.ts`.
8. **Present the full draft text inline** for human review.
9. **Do NOT write to `src/pages/$1/` until the human replies `approved`.**

**Approval flow**:
- Human replies `approved` → promote to `src/pages/$1/$1.page.ts` with provenance header:
  `// @provenance runId=$2 approvedAt=<current-ISO-timestamp> gate=page-object-review`
- Human provides feedback → re-draft incorporating the feedback (max 3 attempts)
- If 3 attempts without approval → mark step blocked and record unresolved feedback
- Draft copy stays in `results/` as immutable run record
