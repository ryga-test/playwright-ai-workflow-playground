# Playwright AI Workflow Playground

A generic TypeScript + Playwright scaffold for experimenting with AI-assisted end-to-end testing workflows across multiple web applications. It is app-agnostic: each app keeps its own profile, page objects, tests, knowledge, and run artifacts.

## Prerequisites

- Node.js 18+
- npm
- Playwright browsers (`npx playwright install chromium`)

## Install

```bash
npm install
npx playwright install chromium
npm run typecheck
```

## Serve the example app

```bash
# Option A
python3 -m http.server 3000 --directory apps/example

# Option B
npx serve apps/example -p 3000
```

Then open `http://localhost:3000`. The page includes a profile form, status table, and navigation links.

## Environment

Copy `.env.example` to `.env` for local overrides:

```bash
cp .env.example .env
```

The v1 example profile uses `EXAMPLE_BASE_URL=http://localhost:3000`. Never commit real credentials, cookies, tokens, storage state, or customer-specific data.

## Add a new app profile

1. Create `apps/<app>/profile.yaml`.
2. Use a lowercase slug for `name` (`[a-z0-9-]+`).
3. Set `baseUrlEnvVar` to the environment variable that will hold the app URL.
4. Add the same variable to `.env.example` with a safe placeholder.
5. Keep app-specific page objects in `src/pages/<app>/`, tests in `tests/<app>/`, knowledge in `knowledge/<app>/`, and run output in `results/<app>/`.

Minimal profile:

```yaml
name: my-app
baseUrlEnvVar: MY_APP_BASE_URL
```

Optional fields are documented in `contracts/profile.schema.yaml`.

## Full pipeline walkthrough

See `specs/001-ai-e2e-framework/quickstart.md` for the planned 8-step AI workflow walkthrough and pi slash-command flow.
