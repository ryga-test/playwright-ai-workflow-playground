---
description: (1/8) Validate app profile, resolve env vars, use pre-generated run ID
argument-hint: "<app> <runId>"
---
Resolve inputs for the $1 application using the pre-generated run ID **$2**:
1. Load and validate `apps/$1/profile.yaml`
2. Read the profile's `baseUrlEnvVar` field and check that env var is set in `.env`
3. Use the exact run ID: **$2**. Do NOT generate a new one.
4. Write run metadata to `results/$1/$2/step1-resolve/run-metadata.json` with `app`, `runId`, `baseUrl`, profile validation status
5. Report the run ID clearly — it will be needed for all subsequent steps
