# pi Adapter

Maps the 8-step `workflows/manifest.yaml` pipeline to pi slash commands.

## Slash Commands

Run each command in order within a pi agent session:

| Order | Slash Command | Gated |
|-------|--------------|-------|
| 1 | `/pipeline-resolve <app>` | No |
| 2 | `/pipeline-discover <app> <run>` | No |
| 3 | `/pipeline-extract-selectors <app> <run>` | No |
| 4 | `/pipeline-draft-page-object <app> <run>` | **Yes** |
| 5 | `/pipeline-draft-tests <app> <run>` | **Yes** |
| 6 | `/pipeline-write-spec <app> <run>` | No |
| 7 | `/pipeline-run-fix <app> <run>` | No |
| 8 | `/pipeline-summarize <app> <run>` | No |

## Placeholder Resolution

The pi agent resolves these placeholders from context:

- `{{app}}` — the app slug (e.g., `example`), matching `apps/<app>/profile.yaml`
- `{{run}}` — the ISO 8601 run ID generated in step 1 (e.g., `2026-04-30T143000Z`)
- `{{baseUrlEnvVar}}` — the environment variable name from the app profile

## Gated Steps (4 and 5)

Steps 4 (draft page object) and 5 (draft tests) require human approval:

1. AI presents the draft artifact inline in the chat session.
2. Human replies with the exact word `approved` to promote the artifact.
3. Or provides change feedback as free-form text — AI re-drafts (max 3 attempts).
4. On approval, the artifact is promoted to its source directory with a provenance header:
   `// @provenance runId=<run> approvedAt=<ISO> gate=<gate-name>`

## Adding a Second Adapter

To add a different AI agent (e.g., Claude), create a new file at `adapters/<agent>/capabilities.yaml`
with the same structure as this file. No changes to `workflows/manifest.yaml` are needed.

Minimal template:

```yaml
adapter: claude

capabilities:
  - step: resolve
    command_template: |
      /claude-pipeline-resolve {{app}}
      ...

  # ... remaining 7 capabilities
```

Each capability must:
- Reference a valid manifest step `id` in its `step` field.
- Provide a `command_template` with `{{app}}` and `{{run}}` placeholders.
- Mark `gated: true` if the corresponding manifest step is gated (steps 4 and 5).

The adapter schema is defined in `contracts/adapter.schema.yaml`.
