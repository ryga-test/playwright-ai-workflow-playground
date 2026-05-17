---
description: (8/8) Write pipeline and flow summaries, update knowledge files with verified observations
argument-hint: "<app> <run>"
---
Summarize results and update knowledge:

1. Read `results/$1/flows/<flow-id>/$2/step7-run-fix/test-report.md`.
2. Read `results/$1/flows/<flow-id>/$2/step1-resolve/flow-inventory.json`.
3. Read the flow summary from `results/$1/flows/<flow-id>/$2/flow-summary.md` when present.
4. Write a pipeline summary to `results/$1/flows/<flow-id>/$2/pipeline-summary.md` covering:
   - all 8 step outcomes (completed/blocked/failed)
   - selected flow and status
   - test pass/fail counts
   - any unresolved issues
   - run ID and duration
5. Ensure the selected flow has `results/$1/flows/<flow-id>/$2/flow-summary.md`; create/update a missing flow summary from the test report.

6. **Update knowledge files** (append-only — never delete or modify existing content):
   - Read `knowledge/$1/knowledge.md`.
   - Extract verified observations from passing tests only: selectors, locator strategies, app-relative start paths, and UI facts.
   - Append verified observations under a new `## Run $2` heading.
   - Do NOT duplicate observations already present in the file.
   - Do NOT modify content under `## Human-Curated` or previous `## Run` headings.

7. Update `knowledge/$1/rules.md`:
   - Derive actionable rules from verified observations.
   - Preserve flow boundaries where relevant.
   - Append under `## Run $2` heading.
   - Preserve all human-curated content and previous run entries.

8. If `knowledge/$1/selector-notes.md` exists, update it with selector-specific findings from this run.
9. Apply `knowledge/PRUNING_POLICY.md`: if an entry has been contradicted or superseded by the last six successful runs, move it from active knowledge files to `knowledge/$1/archive.md` and record the action in `knowledge/$1/prune-log.md`. Absence from recent runs alone is not enough to prune.
10. Regenerate `knowledge/$1/current.md` as the compact active summary.
