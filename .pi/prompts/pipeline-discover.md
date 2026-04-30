---
description: (2/8) Capture Playwright ARIA snapshot and identify interactive elements
argument-hint: "<app> <run>"
---
Discover the UI of the $1 application:
1. Read `results/$1/$2/step1-resolve/run-metadata.json` for the base URL
2. Navigate to the app's base URL using Playwright
3. Capture a full Playwright ARIA snapshot
4. Write the snapshot to `results/$1/$2/step2-discover/snapshot.yaml`
5. Identify all interactive elements (buttons, inputs, links, table cells) and list as selector candidates
6. Write selector candidates to `results/$1/$2/step2-discover/selector-candidates.md`

Locator priority: getByRole > getByTestId > getByLabel > getByPlaceholder > getByText > CSS/XPath

If the app is not reachable, write an error artifact instead of crashing.
