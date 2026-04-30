---
description: (8/8) Write pipeline summary, update knowledge files with verified observations
argument-hint: "<app> <run>"
---
Summarize results and update knowledge:

1. Read `results/$1/$2/step7-run-fix/test-report.md`
2. Write a pipeline summary to `results/$1/$2/pipeline-summary.md` covering:
   - All 8 step outcomes (completed/blocked/failed)
   - Test pass/fail counts
   - Any unresolved issues
   - Run ID and duration

3. **Update knowledge files** (append-only — never delete or modify existing content):
   - Read `knowledge/$1/knowledge.md`
   - Extract **verified observations**: selectors, locator strategies, and UI facts that were used in **passing** Playwright tests during this run
   - Append verified observations under a new `## Run $2` heading
   - Do NOT duplicate observations already present in the file
   - Do NOT modify content under `## Human-Curated` or previous `## Run` headings

4. Update `knowledge/$1/rules.md`:
   - Derive actionable rules from verified observations (e.g., preferred locator patterns, timing considerations)
   - Append under `## Run $2` heading
   - Preserve all human-curated content and previous run entries

5. If `knowledge/$1/selector-notes.md` exists, update with selector-specific findings from this run.
