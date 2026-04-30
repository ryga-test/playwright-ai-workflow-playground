---
description: (1/8) Validate app profile, resolve env vars, generate run ID
argument-hint: "<app>"
---
Resolve inputs for the $1 application:
1. Load and validate `apps/$1/profile.yaml`
2. Read the profile's `baseUrlEnvVar` field and check that env var is set in `.env`
3. Generate a run ID from the current ISO 8601 timestamp (format: `YYYY-MM-DDTHHMMSSZ`)
4. Write run metadata to `results/$1/<run>/step1-resolve/run-metadata.json` with `app`, `runId`, `baseUrl`, profile validation status
5. Report the run ID clearly — it will be needed for all subsequent steps
