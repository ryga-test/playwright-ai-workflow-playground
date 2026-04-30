---
description: (4/8) Draft TypeScript page object — GATED, requires human approval
argument-hint: "<app> <run>"
---
⚠️ **GATED STEP — human approval required before promotion.**

Draft a TypeScript page object:
1. Read `results/$1/$2/step3-extract-selectors/normalized-selectors.md`
2. Generate a TypeScript page object class using `@playwright/test` `Page`
3. Use the normalized selectors with proper locator methods (`getByRole`, `getByLabel`, etc.)
4. Write the draft to `results/$1/$2/step4-draft-page-object/page-object.draft.ts`
5. **Present the full draft text inline** for human review
6. **Do NOT write to `src/pages/$1/` until the human replies `approved`**

**Approval flow**:
- Human replies `approved` → promote to `src/pages/$1/$1.page.ts` with provenance header:
  `// @provenance runId=$2 approvedAt=<current-ISO-timestamp> gate=page-object-review`
- Human provides feedback → re-draft incorporating the feedback (max 3 attempts)
- If 3 attempts without approval → mark step blocked and record unresolved feedback
- Draft copy stays in `results/` as immutable run record
