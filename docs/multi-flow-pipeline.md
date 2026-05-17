# Multi-flow Pipeline Design

Status: superseded for run cardinality. Captured from the multi-flow design grilling session on 2026-05-10; updated by Design Decision 16 on 2026-05-17. Flow YAML support remains, but each pipeline run now targets exactly one `FLOW_ID` and writes artifacts under `results/<app>/flows/<flow-id>/<run>/`.

## Goal

Support multiple named user flows for one app, starting with `apps/automation-in-testing/`, while keeping app discovery/page objects shared and flow test generation, approval, execution, and reporting isolated.

## Proof-of-concept phase

The first implementation should prove the shape of multi-flow support without trying to complete every future safety feature at once.

POC goals:

1. Add `contracts/flow.schema.yaml` for the agreed v1 flow shape.
2. Add initial flow YAML files under `apps/automation-in-testing/flows/`.
3. Add flow loading/validation helpers.
4. Add `FLOW_IDS` filtering.
5. Add `src/helpers/test-data.ts` for relative dates and synthetic emails.
6. Migrate existing `automation-in-testing` app-level feature/spec coverage into per-flow feature/spec files.
7. Preserve the existing shared app page object.
8. Keep AI runner/pipeline automation changes incremental; let real runs identify the next hardening steps.

POC must-have validation:

- Flow ID slug format.
- Flow filename matches `id`.
- Required fields exist.
- Unknown `FLOW_IDS` are hard errors.
- Duplicate `FLOW_IDS` are hard errors.
- Profile and flow tags are merged and de-duplicated.
- `auth.required: true` is rejected.
- `sideEffects` values other than `none` are rejected for execution.
- `startPath` is app-relative when present.

POC can defer full hardening, including:

- Complete YAML anchor detection.
- Full unknown-field rejection if schema tooling makes it costly.
- Conditional `cleanup` / `riskAcknowledgement` enforcement.
- Deep secret-pattern scanning.
- Per-path Playwright discovery artifact generation.
- Full flow inventory emission on every failure mode.
- Dry-run command.

These deferred items remain part of the target design below and should be added incrementally after the first real multi-flow runs.

## Source files

Flow definitions are human-authored YAML files:

```text
apps/<app>/flows/<flow-id>.yaml
```

Rules:

- `flow-id` uses slug format `[a-z0-9-]+`.
- Filename must match `id`.
- YAML is preferred over JSON because flow files contain human intent, safety constraints, goals, and notes.
- JSON is acceptable for generated runtime artifacts such as inventories and resolved test data.
- YAML anchors/aliases are rejected/avoided.
- Unknown fields are rejected.

## Flow schema shape

Each flow uses `version: "1.0"`; only that version is accepted initially.

Required or supported fields:

```yaml
version: "1.0"
id: room-search
name: Room search
goal: >
  Verify a public visitor can choose stay dates, check availability,
  and see room booking options without completing a reservation.
startPath: "/#booking" # optional, defaults to "/"
tags:
  - smoke # optional; merged with profile testTags
auth:
  required: false
sideEffects: none
allowedActions:
  - navigate
  - fill-form
  - submit-query
  - assert
forbiddenActions:
  - create-booking
  - complete-checkout
successCriteria:
  - Visitor sees available room options
  - Visitor remains outside reservation checkout
outOfScope:
  - Completing a room reservation
knowledgeRefs:
  - knowledge/automation-in-testing/rules.md
notes: >
  Extra human guidance for the AI generator.
testData:
  checkIn:
    strategy: relative-date
    offsetDays: 7
    format: DD/MM/YYYY
  checkOut:
    strategy: relative-date
    offsetDays: 8
    format: DD/MM/YYYY
  contactEmail:
    strategy: synthetic-email
    domain: example.test
  subject: Read-only smoke test
```

## Validation and safety

- Validate all flow files for an app before applying `FLOW_IDS` filtering.
- Unknown `FLOW_IDS` are hard errors.
- Duplicate `FLOW_IDS` are hard errors.
- `FLOW_IDS` accepts whitespace around commas.
- Default run order is sorted by flow ID; filtered runs preserve user-specified order.
- Flow tags and profile tags use slug format and are de-duplicated while preserving order.
- Merged tags must contain at least one tag.
- `startPath` must be app-relative, e.g. `/`, `/#booking`, `/admin`.
- `knowledgeRefs` are optional, but every referenced file must exist and stay under `knowledge/<app>/`.
- `auth` is required. v1 allows auth metadata, but runner fail-fasts when `auth.required: true`.
- `sideEffects` is required and may be `none`, `reversible`, or `destructive`; v1 runner only allows `none`.
- `sideEffects: reversible` requires `cleanup` and forbids it otherwise.
- `sideEffects: destructive` requires `riskAcknowledgement` and forbids it otherwise.
- Unsafe flows fail fast during resolve before AI prompts are generated.
- `allowedActions` is required and non-empty.
- `forbiddenActions` is required, can be empty, and uses controlled vocabulary.
- Any action appearing in both allowed and forbidden lists is a hard error.
- For `sideEffects: none`, the resolver adds implied effective forbidden actions such as `create-booking`, `complete-checkout`, `payment`, `delete-data`, and `send-external-message`.

Controlled v1 action vocabulary:

```yaml
allowedActions:
  - navigate
  - click-link
  - fill-form
  - submit-query
  - assert

forbiddenActions:
  - submit-contact-form
  - create-booking
  - complete-checkout
  - payment
  - login
  - admin-action
  - delete-data
  - send-external-message
```

## Test data

`testData` is optional and may contain nested YAML values. It supports literal scalar/map/list values plus strategy objects.

v1 strategies:

- `relative-date` with integer `offsetDays` and format `DD/MM/YYYY`, `YYYY-MM-DD`, or `MM/DD/YYYY`
- `synthetic-email` with reserved/test domains only: `example.test`, `example.com`, `example.org`, `example.net`, or `.test` domains

Not v1:

- `env-var`
- fixture lookup
- random strings
- metadata wrappers/labels per field

Secret-looking keys and obvious secret-looking string values are rejected during flow validation and before writing resolved artifacts.

Pipeline artifacts should resolve strategy values for reproducibility. Committed specs should not embed stale resolved dates; they should use generic helpers such as:

```ts
formatRelativeDate(7, 'DD/MM/YYYY');
syntheticEmail('room-search', 'example.test');
```

The helper should live in `src/helpers/test-data.ts`, stay independent of flow YAML loading, use local time for relative dates, and use `PLAYWRIGHT_RUN_ID` for synthetic email local parts when available.

## Pipeline selection and artifacts

By default, the pipeline runs all flow files for the app. `FLOW_IDS=room-search,contact-message` filters the whole pipeline: generation, approval, writing, execution, and summarization.

Step 1 writes a run-specific flow inventory:

```text
results/<app>/<run>/step1-resolve/flow-inventory.json
```

The inventory records selected flow metadata, rejected flow details when fail-fast resolution fails, declared and effective forbidden actions, merged tags, auth/side-effect classification, source files, and references to per-flow resolved test data. It should not embed resolved test data.

Per-flow resolved test data lives at:

```text
results/<app>/<run>/flows/<flow-id>/resolved-test-data.json
```

## Discovery and page objects

Discovery and page-object generation are shared at the app level, not repeated per flow.

- Discover all unique selected `startPath` values.
- Store one artifact set per path plus a merged summary:

```text
results/<app>/<run>/step2-discover/
├── paths/
│   ├── root.snapshot.yaml
│   ├── hash-booking.snapshot.yaml
│   └── hash-contact.snapshot.yaml
├── snapshot.merged.yaml
└── selector-candidates.md
```

- Convert paths into readable filesystem labels, e.g. `/` → `root`, `/#booking` → `hash-booking`, `/admin/users` → `admin-users`.
- Append stable indexes if labels collide.
- Page-object provenance should include all discovery paths.

## Approval gates

- One shared app-level page-object approval gate.
- One test-draft approval gate per flow.
- If shared page-object approval fails/maxes out, all flows stop.
- If one flow test-draft approval fails/maxes out, mark that flow failed and continue other flows.

## Promoted test layout

Use one shared page object:

```text
src/pages/<app>/<app>.page.ts
```

Generate separate committed feature/spec files per flow:

```text
tests/<app>/<flow-id>.feature
tests/<app>/<flow-id>.spec.ts
```

Existing app-level feature/spec files should be migrated away rather than kept as aggregate wrappers.

Committed `.feature` files should include stable provenance such as source flow path, not run-specific `results/` paths. Run-specific drafts may include resolved-test-data artifact references.

Generated `.spec.ts` files should include provenance back to the source flow YAML and comments indicating which helper/literal came from which `testData` field.

## Execution and summaries

The AI pipeline runs one Playwright command per selected flow to keep reports and triage isolated. Normal developer `npm test` keeps standard Playwright behavior and may run all specs together.

Artifacts include both:

```text
results/<app>/<run>/pipeline-summary.md
results/<app>/<run>/flows/<flow-id>/flow-summary.md
```

## Initial `automation-in-testing` flows

Split the current app-level scenarios into seven focused flows:

1. `public-home`
2. `section-navigation`
3. `room-search`
4. `room-display`
5. `contact-message`
6. `location-contact-info`
7. `policy-links`

Additional flow-specific decisions:

- Keep `section-navigation` and `room-display` separate.
- `room-search` verifies booking options are visible and does not click room `Book now` links in v1.
- `contact-message` fills the form but never clicks Submit.
- `policy-links` asserts visibility and `href` values only in v1.

## Optional future work

- `pipeline:dry-run` to resolve/validate selected flows without generation.
- Authenticated flow execution.
- Reversible/destructive flow execution with cleanup/risk controls.
- Additional test-data strategies.
- Explicit timezone support.
