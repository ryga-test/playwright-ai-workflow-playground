---
description: (5/8) Draft GWT test scenarios — GATED, requires human approval
argument-hint: "<app> <run>"
---
⚠️ **GATED STEP — human approval required before proceeding.**

Draft GWT-style test scenarios:
1. Read `results/$1/$2/step4-draft-page-object/page-object.draft.ts`
2. Read `knowledge/$1/knowledge.md` for app context and prior observations
3. Generate Given-When-Then test scenarios covering:
   - All interactive elements from the discovery snapshot
   - Form interactions (fill, submit, validation)
   - Table content verification
   - Navigation and page structure
4. Write the draft to `results/$1/$2/step5-draft-tests/test-draft.md`
5. **Present the full draft text inline** for human review
6. **Do NOT proceed to spec writing until the human replies `approved`**

**Approval flow**:
- Human replies `approved` → mark as approved, retain draft in `results/`
- Human provides feedback → re-draft incorporating the feedback (max 3 attempts)
- If 3 attempts without approval → mark step blocked and record unresolved feedback
