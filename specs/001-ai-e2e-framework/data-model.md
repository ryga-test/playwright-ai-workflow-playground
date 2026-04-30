# Data Model: Playwright AI E2E Framework

**Feature**: `001-ai-e2e-framework`
**Date**: 2026-04-30

## Entities

### 1. AppProfile

Represents a target application under test.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Unique slug: `[a-z0-9-]+`. Used in directory paths (`apps/<name>/`, `src/pages/<name>/`, etc.) |
| `baseUrlEnvVar` | `string` | ✅ | Environment variable name referencing the app's base URL (e.g., `EXAMPLE_BASE_URL`). Never the URL value itself. |
| `authMethod` | `string` | ❌ | Free-text notes about authentication (e.g., `"none"`, `"basic-auth"`, `"storage-state"`). Optional. |
| `testTags` | `string[]` | ❌ | Tags applied to Playwright tests for this app (e.g., `["smoke", "regression"]`). Optional. |
| `storageStatePath` | `string` | ❌ | Path to a Playwright storage state file for authenticated sessions (e.g., `state/example-auth.json`). Referenced by env var, never hardcoded. Gitignored. Optional. |

**Storage**: `apps/<name>/profile.yaml`

**Validation rules**:
- `name` MUST match `^[a-z0-9-]+$`
- `name` MUST be unique across all profiles
- `baseUrlEnvVar` MUST be a valid environment variable name (`^[A-Z_][A-Z0-9_]*$`)
- If `storageStatePath` is provided, the file MUST be gitignored

**Example** (`apps/example/profile.yaml`):
```yaml
name: example
baseUrlEnvVar: EXAMPLE_BASE_URL
authMethod: none
testTags:
  - smoke
  - demo
```

---

### 2. PipelineManifest

Defines the 8-step workflow in agent-agnostic terms.

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Manifest schema version (`"1.0"`) |
| `pipeline` | `string` | Pipeline name (`"ai-e2e-workflow"`) |
| `steps` | `Step[]` | Ordered list of 8 pipeline steps |

**Step structure**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Step identifier (`"resolve"`, `"discover"`, etc.) |
| `name` | `string` | Human-readable name (`"Resolve Inputs"`) |
| `order` | `number` | Execution order (1–8) |
| `gated` | `boolean` | Whether human approval is required before proceeding. Only steps 4 and 5 are gated. |
| `inputs` | `ArtifactRef[]` | Input artifacts with `{{placeholder}}` paths |
| `outputs` | `ArtifactRef[]` | Output artifacts with `{{placeholder}}` paths |
| `description` | `string` | One-line summary of what the step does |

**ArtifactRef structure**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Artifact logical name (`"snapshot"`, `"selectors"`) |
| `path` | `string` | Relative path template (`"results/{{app}}/{{run}}/step2-discover/snapshot.yaml"`) |
| `format` | `string` | File format (`"yaml"`, `"markdown"`, `"typescript"`) |

**Storage**: `workflows/manifest.yaml`

**Gated steps** (per FR-020):
- Step 4 (draft page object) — `gated: true`
- Step 5 (draft tests) — `gated: true`
- All other steps — `gated: false`

---

### 3. AdapterCapabilities

Maps neutral manifest capabilities to agent-specific command templates.

| Field | Type | Description |
|-------|------|-------------|
| `adapter` | `string` | Agent identifier (`"pi"`, `"claude"`, etc.) |
| `capabilities` | `Capability[]` | List of capability mappings |

**Capability structure**:

| Field | Type | Description |
|-------|------|-------------|
| `step` | `string` | References manifest step `id` |
| `command_template` | `string` | Agent-specific command text with `{{placeholders}}`. This is the canonical prompt for the step. |
| `gated` | `boolean` | Whether this capability triggers a human review gate (mirrors manifest) |

**Storage**: `adapters/<agent>/capabilities.yaml`

---

### 4. WorkflowRun

Represents a single pipeline execution against one app.

| Field | Type | Description |
|-------|------|-------------|
| `runId` | `string` | ISO 8601 UTC timestamp (`2026-04-30T143000Z`). Guarantees uniqueness and sortability. |
| `app` | `string` | App slug referencing an AppProfile |
| `startedAt` | `string` | ISO 8601 timestamp of pipeline start |
| `completedAt` | `string` | ISO 8601 timestamp of pipeline completion (or null if in progress) |
| `status` | `enum` | `"in-progress"`, `"completed"`, `"blocked"` (stuck at review gate), `"failed"` |
| `steps` | `StepResult[]` | Per-step outcomes |

**StepResult structure**:

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | `string` | References manifest step `id` |
| `status` | `enum` | `"pending"`, `"in-progress"`, `"completed"`, `"blocked"` (review rejected), `"failed"` |
| `artifacts` | `ArtifactResult[]` | Produced artifacts |
| `approvalStatus` | `enum` | `"not-gated"`, `"pending"`, `"approved"`, `"rejected"` (only for gated steps) |
| `rejectionReason` | `string` | Human feedback if rejected (null otherwise) |
| `rejectionCount` | `number` | Number of re-draft attempts (max 3) |

**ArtifactResult structure**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Logical name matching manifest ArtifactRef |
| `path` | `string` | Actual file path (placeholders resolved) |
| `format` | `string` | File format (matches manifest) |
| `checksum` | `string` | SHA-256 hash (for future drift detection) |

**Storage**: Inferred from `results/<app>/<runId>/` directory structure. A `run-metadata.json` MAY be written to `results/<app>/<runId>/run-metadata.json` for programmatic consumption.

---

### 5. KnowledgeEntry

Durable, app-specific knowledge accumulated across pipeline runs.

| Field | Type | Description |
|-------|------|-------------|
| `app` | `string` | App slug |
| `category` | `enum` | `"knowledge"`, `"rules"`, `"selector-notes"` |
| `runId` | `string` | The run that produced this entry (or `"human"` for manually added content) |
| `content` | `string` | Markdown content of the entry |
| `verified` | `boolean` | `true` if the observation was used in a passing Playwright test during its run |

**Storage**: `knowledge/<app>/<category>.md` — all entries for a category are stored in a single file, organized under `## Run <runId>` or `## Human-Curated` headings.

**File structure example** (`knowledge/example/knowledge.md`):
```markdown
# Knowledge: example

## Human-Curated
- The example app uses standard HTML form elements with no framework-specific attributes.

## Run 2026-04-30T143000Z
- Form has 3 input fields: text (username), password, email.
- Submit button text is "Save Changes".
- Data table has 4 rows with columns: Name, Status.
- Navigation links: "Dashboard", "Settings", "Reports".
```

---

### 6. ApprovalGate

A checkpoint in the pipeline where human review is required.

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | `string` | The gated manifest step (`"draft-page-object"` or `"draft-tests"`) |
| `runId` | `string` | The run this gate belongs to |
| `artifacts` | `string[]` | Paths to artifacts requiring approval |
| `status` | `enum` | `"pending"`, `"approved"`, `"rejected"` |
| `approvedAt` | `string` | ISO 8601 timestamp of approval (null if pending/rejected) |
| `rejectionReason` | `string` | Human feedback if rejected |
| `attemptCount` | `number` | Current re-draft attempt (1–3) |

**Provenance header** (embedded in promoted artifacts per FR-021a):
```typescript
// @provenance runId=2026-04-30T143000Z approvedAt=2026-04-30T143500Z gate=page-object-review
```

---

### 7. ApprovalLock (Schema Only — Not Enforced in v1)

Schema for future automated drift detection. Defined in `contracts/approval-lock.schema.yaml`.

| Field | Type | Description |
|-------|------|-------------|
| `runId` | `string` | The run that produced the approved artifacts |
| `gatedStep` | `string` | The gated step ID |
| `approvedAt` | `string` | ISO 8601 approval timestamp |
| `artifacts` | `LockedArtifact[]` | Array of locked artifact entries |

**LockedArtifact structure**:

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Relative path to the approved artifact |
| `sha256` | `string` | SHA-256 hash of the approved artifact content |

---

## Entity Relationships

```
AppProfile (1) ────< (N) WorkflowRun
WorkflowRun (1) ────< (N) StepResult
StepResult (1) ────< (N) ArtifactResult
WorkflowRun (1) ────< (N) KnowledgeEntry
AppProfile (1) ────< (N) KnowledgeEntry
WorkflowRun (1) ────< (2) ApprovalGate   (only steps 4, 5 are gated)
PipelineManifest (1) ────< (8) Step      (fixed 8 steps)
AdapterCapabilities (1) ────< (8) Capability  (one adapter maps all 8 steps)
```

## State Transitions

### WorkflowRun

```
[in-progress] ──(all steps complete)──> [completed]
[in-progress] ──(gate blocked)────────> [blocked]
[in-progress] ──(step failed)─────────> [failed]
```

### StepResult (non-gated)

```
[pending] ──> [in-progress] ──> [completed] | [failed]
```

### StepResult (gated: steps 4, 5)

```
[pending] ──> [in-progress] ──> awaiting review
  ├── approved ──> [completed]
  └── rejected  (attempt < 3) ──> [in-progress] (re-draft)
  └── rejected  (attempt = 3) ──> [blocked]
```

### KnowledgeEntry

```
[empty scaffolding] ──(pipeline run)──> [populated] ──(subsequent run)──> [updated]
                                                                         └── appends only, never deletes
```
