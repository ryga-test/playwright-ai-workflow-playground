---
description: (7/8) Execute the selected flow test, triage failures, fix script bugs only
argument-hint: "<app> <run>"
---
Run the selected flow test and fix script bugs:

1. Read `results/$1/flows/<flow-id>/$2/step1-resolve/run-metadata.json`, `flow-inventory.json`, and `apps/$1/profile.yaml` to determine the single selected flow ID, `resultRoot`, and runner mode.
2. Set env vars:
   - `APP_NAME=$1`
   - `PLAYWRIGHT_RUN_ID=$2` to enable screencast recording
   - `FLOW_ID=<selected-flow-id>`
3. Run exactly one Playwright command, based on `runner`:
   - `runner: native` → `APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 FLOW_ID=<flow-id> npx playwright test --reporter=html`
   - `runner: docker` → `docker run --rm --ipc=host -v "$(pwd)":/app -w /app mcr.microsoft.com/playwright:$(cat .docker-version) APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 FLOW_ID=<flow-id> npx playwright test --reporter=html`
4. The base fixture records per-test screencast video with action annotations into `results/$1/flows/<flow-id>/$2/step7-run-fix/`.
5. For each failing test, classify the failure:
   - **script_bug**: the spec code is wrong (wrong selector, missing await, logic error) → fix the spec code
   - **app_bug**: the app behavior changed (element missing, wrong text, unexpected state) → report only, do NOT modify the app
   - **blocker**: cannot proceed (app unreachable, auth failure, infrastructure issue) → report and mark flow blocked
6. For script_bug failures, fix only the spec/page-object code and re-run the same flow (max 3 fix cycles).
7. Write the flow report to `results/$1/flows/<flow-id>/$2/flow-summary.md`.
8. Write the test report to `results/$1/flows/<flow-id>/$2/step7-run-fix/test-report.md` with pass/fail/triage per test.
9. Ensure HTML report, traces, screenshots, and screencast videos are retained under the flow run result directory.
