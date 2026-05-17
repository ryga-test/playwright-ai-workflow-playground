---
description: (3/8) Normalize shared selector candidates with path and flow provenance
argument-hint: "<app> <run>"
---
Extract and normalize selectors:

1. Read `results/$1/flows/<flow-id>/$2/step2-discover/snapshot.merged.yaml` when present; otherwise read `results/$1/flows/<flow-id>/$2/step2-discover/snapshot.yaml`.
2. Read all per-path snapshots from `results/$1/flows/<flow-id>/$2/step2-discover/paths/` when present.
3. Read `results/$1/flows/<flow-id>/$2/step2-discover/selector-candidates.md`.
4. Read `results/$1/flows/<flow-id>/$2/step1-resolve/flow-inventory.json` to preserve selected flow and start-path provenance.
5. Normalize selectors using Playwright locator priority order:
   - **getByRole** (preferred — accessible, stable, framework-agnostic)
   - **getByTestId** (stable when data-testid attributes exist)
   - **getByLabel** (good for form inputs with associated labels)
   - **getByPlaceholder** (usable, less stable than labels)
   - **getByText** (fragile to content changes)
   - **CSS/XPath** (last resort — brittle, document with justification)
6. Annotate each selector with priority level, rationale, source discovery path(s), and relevant flow IDs when known.
7. Write normalized selectors to `results/$1/flows/<flow-id>/$2/step3-extract-selectors/normalized-selectors.md`.
