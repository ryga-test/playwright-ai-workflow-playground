---
description: (1/8) Validate app profile, one flow file, env vars, and pre-generated run ID
argument-hint: "<app> <runId>"
---
Resolve inputs for the $1 application using the pre-generated run ID **$2**.

Flow context must include `FLOW_ID: <flow-id>`. A pipeline run targets exactly one flow.

1. Load and validate `apps/$1/profile.yaml`.
2. Read the profile's `baseUrlEnvVar` field and check that env var is set in `.env`.
3. Use the exact run ID: **$2**. Do NOT generate a new one.
4. Prefer the resolver command to produce consistent artifacts:
   `node scripts/resolve-flows.js $1 $2 <flow-id>`
5. If manually resolving, validate only the selected `apps/$1/flows/<flow-id>.yaml` file:
   - flow ID slug format
   - filename matches `id`
   - required fields exist
   - profile tags and flow tags are merged and de-duplicated
   - `auth.required: true` is rejected
   - `sideEffects` other than `none` is rejected for execution
   - `startPath` is app-relative when present
   - unknown `FLOW_ID` is a hard error and should list available flow IDs
   - comma-separated or legacy `FLOW_IDS` input is a hard error
6. Write run metadata to `results/$1/flows/<flow-id>/$2/step1-resolve/run-metadata.json` including `app`, `flowId`, `runId`, `resultRoot`, `baseUrl`, profile validation status, flow mode, and selected flow IDs.
7. Write `results/$1/flows/<flow-id>/$2/step1-resolve/flow-inventory.json`. Keep `selectedFlows`/`flows` as one-item compatibility arrays with selected flow metadata, source file, merged tags, declared/effective forbidden actions, auth and side-effect classification, start path, and reference to the resolved test data artifact. Do not embed resolved test data in the inventory.
8. Write resolved test data to `results/$1/flows/<flow-id>/$2/resolved-test-data.json` when the flow has `testData`.
9. Report the run ID, selected flow, and result root clearly.
