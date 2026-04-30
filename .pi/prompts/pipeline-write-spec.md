---
description: (6/8) Generate Playwright spec from approved artifacts
argument-hint: "<app> <run>"
---
Write the Playwright spec (only after both review gates are approved):

1. Read the approved test draft from `results/$1/$2/step5-draft-tests/test-draft.md`
2. Read the approved page object from `src/pages/$1/$1.page.ts`
3. **Check for existing spec**: if `tests/$1/$1.spec.ts` exists with a provenance header from a previous run:
   - Present a diff of proposed changes to the human
   - Request explicit re-approval before overwriting
   - On re-approval, update the provenance header with the new run ID
4. Generate a complete Playwright spec using `@playwright/test`
5. Add provenance header: `// @provenance runId=$2 approvedAt=<now> gate=test-draft-review`
6. Write the spec to `tests/$1/$1.spec.ts`
7. Run `npm run typecheck` to verify compilation — fix any errors before declaring step complete
