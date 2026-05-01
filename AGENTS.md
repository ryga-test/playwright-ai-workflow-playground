<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/001-ai-e2e-framework/plan.md`. Reference docs:
- Constitution: `.specify/memory/constitution.md` (v1.0.0)
- Spec: `specs/001-ai-e2e-framework/spec.md`
- Research: `specs/001-ai-e2e-framework/research.md`
- Data Model: `specs/001-ai-e2e-framework/data-model.md`
- Contracts: `specs/001-ai-e2e-framework/contracts/`
- Quickstart: `specs/001-ai-e2e-framework/quickstart.md`
- Design Decisions: `DESIGN_DECISIONS.md`
<!-- SPECKIT END -->

---

<!-- fallow:setup-hooks:start -->
## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking.

Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict. Inherited findings on touched files are reported under `attribution` and annotated with `introduced: false`, but do not block the commit. Set `[audit] gate = "all"` in `fallow.toml` to gate every finding in changed files.
<!-- fallow:setup-hooks:end -->
