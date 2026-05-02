---
description: (6/8) Generate Playwright spec from approved artifacts
argument-hint: "<app> <run>"
---
Write the Playwright spec (only after both review gates are approved):

1. Read the approved test draft from `results/$1/$2/step5-draft-tests/test-draft.md`
2. Read the approved page object from `src/pages/$1/$1.page.ts`
3. **Check for existing spec**: if `tests/$1/$1.spec.ts` exists with a provenance header from a previous run:
   - Generate the proposed replacement spec from the approved Step 5 draft
   - Write a diff artifact to `results/$1/$2/step6-write-spec/spec.diff`
   - Overwrite `tests/$1/$1.spec.ts` automatically; Step 5 approval authorizes spec generation
   - Update the provenance header with the new run ID
   - Do **not** request another human approval in this step
4. Generate a complete Playwright spec using `@playwright/test` in **Given-When-Then (GWT) format**:
   - Each `test()` block MUST follow the `test.describe` / `test` pattern
   - Every test body MUST be structured as three clearly commented sections:
     ```typescript
     test('descriptive scenario name', async ({ page, myPage }) => {
       // Given — arrange: navigate, set up preconditions
       // When  — act: perform the user action under test
       // Then  — assert: verify the expected outcome
     });
     ```
   - `Given` sections set up initial state (e.g., `await page.goto(url)`)
   - `When` sections perform the user action (e.g., `await myPage.fillForm(...)`)
   - `Then` sections assert expected results using Playwright assertions (`expect`)
   - Each scenario from the approved test draft maps 1:1 to a `test()` block — do NOT merge, split, or reorder scenarios
   - Use the page object methods declared in `src/pages/$1/$1.page.ts` for all element interactions
5. Add provenance header at the top of the file:
   `// @provenance runId=$2 approvedAt=<now> gate=test-draft-review`
6. Write the spec to `tests/$1/$1.spec.ts`
7. Run `npm run typecheck` to verify compilation — fix any errors before declaring step complete
