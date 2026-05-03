# Knowledge Pruning Policy

Knowledge files are optimized for active, verified truth while preserving auditability.

## Six-Run Automated Pruning Rule

During the Step 8 summarize/knowledge update, the agent MUST evaluate knowledge entries for the target app against the last six successful pipeline runs for that same app.

An entry may be automatically pruned from active knowledge files only when all conditions are true:

1. The entry is not under `## Human-Curated`.
2. The entry has been contradicted by, or superseded in, the last six successful runs.
3. The current app source, Playwright specs, page objects, profile, and config do not support the entry as active truth.
4. The replacement entry or contradiction evidence is identified.
5. The pruned content is moved to `knowledge/<app>/archive.md` before removal from the active file.
6. The prune action is recorded in `knowledge/<app>/prune-log.md` with date, source location, reason, evidence runs, and replacement if any.

Absence from recent runs is not enough to prune. Information that is merely unmentioned should be marked as `unverified` or `needs-review`, not removed.

## Protected Content

The agent MUST NOT automatically prune:

- `## Human-Curated` content
- secrets-handling guidance
- app isolation guidance
- current environment/profile configuration still present in source
- historical run artifacts under `results/`

## Active Summary

Agents SHOULD maintain `knowledge/<app>/current.md` as a generated active summary. Future pipeline steps should prefer `current.md` for compact context, then consult raw files when provenance is needed.
