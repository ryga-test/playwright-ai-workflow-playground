---
description: (1/8) Validate app profile, flow files, env vars, and pre-generated run ID
argument-hint: "<app> <runId>"
---
Resolve inputs for the $1 application using the pre-generated run ID **$2**.

Flow context may be included in the user message as `FLOW_IDS filter: ...`.

1. Load and validate `apps/$1/profile.yaml`.
2. Read the profile's `baseUrlEnvVar` field and check that env var is set in `.env`.
3. Use the exact run ID: **$2**. Do NOT generate a new one.
4. Prefer the resolver command to produce consistent artifacts:
   `node scripts/resolve-flows.js $1 $2 <comma-separated-flow-ids-if-any>`
5. If manually resolving, and `apps/$1/flows/` exists, validate **all** flow YAML files before applying `FLOW_IDS` filtering:
   - flow ID slug format
   - filename matches `id`
   - required fields exist
   - profile tags and flow tags are merged and de-duplicated
   - `auth.required: true` is rejected
   - `sideEffects` other than `none` is rejected for execution
   - `startPath` is app-relative when present
   - unknown `FLOW_IDS` are hard errors
   - duplicate `FLOW_IDS` are hard errors
6. Resolve selected flows:
   - no `FLOW_IDS`: all flow files sorted by flow ID
   - `FLOW_IDS`: selected flows in user-specified order, accepting whitespace around commas
7. Write run metadata to `results/$1/$2/step1-resolve/run-metadata.json` including `app`, `runId`, `baseUrl`, profile validation status, flow mode, and selected flow IDs.
8. Write `results/$1/$2/step1-resolve/flow-inventory.json` when flows exist. Include selected flow metadata, source files, merged tags, declared/effective forbidden actions, auth and side-effect classification, start paths, and references to per-flow resolved test data artifacts. Do not embed resolved test data in the inventory.
9. Write per-flow resolved test data to `results/$1/$2/flows/<flow-id>/resolved-test-data.json` when a flow has `testData`.
10. Report the run ID and selected flows clearly.
