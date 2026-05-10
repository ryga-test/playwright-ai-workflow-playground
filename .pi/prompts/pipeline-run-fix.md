---
description: (7/8) Execute selected flow tests, triage failures, fix script bugs only
argument-hint: "<app> <run>"
---
Run selected flow tests and fix script bugs:

1. Read `results/$1/$2/step1-resolve/flow-inventory.json` when present to determine selected flow IDs.
2. Set env vars:
   - `APP_NAME=$1`
   - `PLAYWRIGHT_RUN_ID=$2` to enable screencast recording
   - `FLOW_IDS=<selected flow IDs comma-separated>` when flow inventory exists
3. Run one Playwright command per selected flow to isolate reports and triage:
   `APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 FLOW_IDS=<flow-id> npx playwright test --reporter=html`
4. In legacy mode with no flow inventory, run:
   `APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 npx playwright test tests/$1/ --reporter=html`
5. The base fixture records per-test screencast video with action annotations into `results/$1/$2/step7-run-fix/`.
6. For each failing test, classify the failure:
   - **script_bug**: the spec code is wrong (wrong selector, missing await, logic error) → fix the spec code
   - **app_bug**: the app behavior changed (element missing, wrong text, unexpected state) → report only, do NOT modify the app
   - **blocker**: cannot proceed (app unreachable, auth failure, infrastructure issue) → report and mark flow blocked
7. For script_bug failures, fix only the spec/page-object code and re-run affected flow (max 3 fix cycles).
8. Write per-flow reports to `results/$1/$2/flows/<flow-id>/flow-summary.md`.
9. Write aggregate test report to `results/$1/$2/step7-run-fix/test-report.md` with pass/fail/triage per flow and per test.
10. Ensure HTML report, traces, screenshots, and screencast videos are retained under the run results directory.
