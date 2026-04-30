---
description: (3/8) Normalize selector candidates with locator priority annotations
argument-hint: "<app> <run>"
---
Extract and normalize selectors:
1. Read `results/$1/$2/step2-discover/snapshot.yaml`
2. Read `results/$1/$2/step2-discover/selector-candidates.md`
3. Normalize selectors using Playwright locator priority order:
   - **getByRole** (preferred — accessible, stable, framework-agnostic)
   - **getByTestId** (stable when data-testid attributes exist)
   - **getByLabel** (good for form inputs with associated labels)
   - **getByPlaceholder** (usable, less stable than labels)
   - **getByText** (fragile to content changes)
   - **CSS/XPath** (last resort — brittle, document with justification)
4. Annotate each selector with its priority level and rationale
5. Write normalized selectors to `results/$1/$2/step3-extract-selectors/normalized-selectors.md`
