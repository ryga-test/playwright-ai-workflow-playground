---
description: (7/8) Execute tests, triage failures, fix script bugs only
argument-hint: "<app> <run>"
---
Run tests and fix script bugs:

1. Run: `npx playwright test tests/$1/ --reporter=html`
2. For each failing test, classify the failure:
   - **script_bug**: the spec code is wrong (wrong selector, missing await, logic error) → fix the spec code
   - **app_bug**: the app behavior changed (element missing, wrong text, unexpected state) → report only, do NOT modify the app
   - **blocker**: cannot proceed (app unreachable, auth failure, infrastructure issue) → report and mark step blocked
3. For script_bug failures:
   - Fix the spec code in `tests/$1/$1.spec.ts`
   - Re-run tests (max 3 fix cycles)
4. Write test report to `results/$1/$2/step7-run-fix/test-report.md` with pass/fail/triage per test
5. Ensure the HTML report, traces, and screenshots are in `results/$1/$2/step7-run-fix/`
   - On failure: trace + screenshot mandatory per failing test
   - On success: trace optional
