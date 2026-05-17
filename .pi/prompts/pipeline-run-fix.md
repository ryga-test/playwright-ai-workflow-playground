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
3. Write the exact run command you are about to execute to `results/$1/flows/<flow-id>/$2/step7-run-fix/run-command.md`.
   - `runner: native` — record the host-side Playwright command.
   - `runner: docker` — record the full Docker command, including `mcr.microsoft.com/playwright:$(cat .docker-version)` and `--ipc=host`.
4. Run exactly one Playwright command, based on `runner`:
   - `runner: native` → `APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 FLOW_ID=<flow-id> npx playwright test --reporter=html`
   - `runner: docker` → `docker run --rm --ipc=host -v "$(pwd)":/app -w /app mcr.microsoft.com/playwright:$(cat .docker-version) APP_NAME=$1 PLAYWRIGHT_RUN_ID=$2 FLOW_ID=<flow-id> npx playwright test --reporter=html`
5. The base fixture records per-test screencast video with action annotations into `results/$1/flows/<flow-id>/$2/step7-run-fix/`.
6. For each failing test, classify the failure:
   - **script_bug**: the spec code is wrong (wrong selector, missing await, logic error) → fix the spec code
   - **app_bug**: the app behavior changed (element missing, wrong text, unexpected state) → report only, do NOT modify the app
   - **blocker**: cannot proceed (app unreachable, auth failure, infrastructure issue) → report and mark flow blocked
7. For script_bug failures, fix only the spec/page-object code and re-run the same flow (max 3 fix cycles).
8. Write the flow report to `results/$1/flows/<flow-id>/$2/flow-summary.md`.
9. Write the test report to `results/$1/flows/<flow-id>/$2/step7-run-fix/test-report.md` with pass/fail/triage per test.
10. Ensure HTML report, traces, screenshots, and screencast videos are retained under the flow run result directory.
