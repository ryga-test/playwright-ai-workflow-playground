---
description: (2/8) Capture shared app discovery artifacts for selected flow start paths
argument-hint: "<app> <run>"
---
Discover the UI of the $1 application.

1. Read `results/$1/$2/step1-resolve/run-metadata.json` for the base URL.
2. If `results/$1/$2/step1-resolve/flow-inventory.json` exists, discover all unique selected flow `startPath` values; otherwise discover `/` only.
3. Navigate to each app-relative start path with Playwright.
4. Capture a Playwright ARIA snapshot for each path.
5. Write per-path snapshots under `results/$1/$2/step2-discover/paths/<path-label>.snapshot.yaml`.
   - `/` → `root`
   - `/#booking` → `hash-booking`
   - `/admin/users` → `admin-users`
   - append stable indexes if labels collide
6. Write a merged app-level snapshot to `results/$1/$2/step2-discover/snapshot.merged.yaml`.
7. For backward compatibility, also write `results/$1/$2/step2-discover/snapshot.yaml` with the merged snapshot.
8. Identify all interactive elements (buttons, inputs, links, table cells) and list selector candidates with path provenance.
9. Write selector candidates to `results/$1/$2/step2-discover/selector-candidates.md`.

Locator priority: getByRole > getByTestId > getByLabel > getByPlaceholder > getByText > CSS/XPath.

If one path is not reachable, write an error artifact for that path and fail the step unless the failure is clearly non-blocking for unselected flows.
