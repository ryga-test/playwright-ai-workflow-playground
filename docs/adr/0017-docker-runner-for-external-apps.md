# 0017-docker-runner-for-external-apps.md

Docker runner for apps targeting remote URLs. The `automation-in-testing` app uses a `runner: docker` profile field, triggering pipeline browser steps (discover via Agent CLI, run/fix via Playwright test) to execute inside an ephemeral `mcr.microsoft.com/playwright` container with the project root bind-mounted. The `example` app remains native — no localhost-in-Docker networking needed. Docker image tag is pinned in `.docker-version` at project root. `@playwright/cli` is a project devDependency available via bind mount. One disposable container per browser step; no long-lived daemons.

**Status:** accepted
**Consequences:** Browser steps for docker-runner apps depend on Docker availability. Artifact paths are unchanged — `results/` writes back to host via bind mount.
