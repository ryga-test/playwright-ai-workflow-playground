---
description: (2/8) Capture shared app discovery artifacts for selected flow start paths
argument-hint: "<app> <run>"
---
Discover the UI of the $1 application.

1. Read `results/$1/flows/<flow-id>/$2/step1-resolve/run-metadata.json`, `flow-inventory.json`, and `apps/$1/profile.yaml` to determine the base URL, selected flow ID, result root, and runner mode.
2. Read `results/$1/flows/<flow-id>/$2/step1-resolve/flow-inventory.json` and discover the selected flow `startPath`.
3. Write the exact discovery command you used to `results/$1/flows/<flow-id>/$2/step2-discover/run-command.md`.
   - `runner: native` — record the host-side Playwright/Agent CLI command(s) you actually ran.
   - `runner: docker` — record the Docker command, including `mcr.microsoft.com/playwright:$(cat .docker-version)` and `--ipc=host`.
4. If `runner: native`, navigate to each app-relative start path with Playwright.
   If `runner: docker`, run the Playwright Agent CLI inside the Playwright Docker image (`mcr.microsoft.com/playwright:$(cat .docker-version)`) with `--ipc=host`, bind-mounting the project root, and use it to navigate and snapshot the page.
5. Capture a Playwright ARIA snapshot for each path.
6. Write per-path snapshots under `results/$1/flows/<flow-id>/$2/step2-discover/paths/<path-label>.snapshot.yaml`.
   - `/` → `root`
   - `/#booking` → `hash-booking`
   - `/admin/users` → `admin-users`
   - append stable indexes if labels collide
7. Write a merged app-level snapshot to `results/$1/flows/<flow-id>/$2/step2-discover/snapshot.merged.yaml`.
8. For backward compatibility, also write `results/$1/flows/<flow-id>/$2/step2-discover/snapshot.yaml` with the merged snapshot.
9. Identify all interactive elements (buttons, inputs, links, table cells) and list selector candidates with path provenance.
10. Write selector candidates to `results/$1/flows/<flow-id>/$2/step2-discover/selector-candidates.md`.

Locator priority: getByRole > getByTestId > getByLabel > getByPlaceholder > getByText > CSS/XPath.

If one path is not reachable, write an error artifact for that path and fail the step unless the failure is clearly non-blocking for unselected flows.
