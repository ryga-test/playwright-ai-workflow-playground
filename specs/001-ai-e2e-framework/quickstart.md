# Quickstart: Playwright AI E2E Framework

This guide walks you through setting up the framework, serving the example app, and running the full 8-step AI workflow pipeline against it.

## Prerequisites

- **Node.js 18+** (LTS): [nodejs.org](https://nodejs.org)
- **npm**: comes with Node.js
- **A pi agent session**: The pipeline uses pi slash commands defined in `adapters/pi/capabilities.yaml`

## 1. Install

```bash
# Clone (if not already in the repo)
cd /path/to/playwright-playground

# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium

# Verify TypeScript compiles
npm run typecheck
```

Expected: `npm run typecheck` reports zero errors.

## 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env — set the example app's base URL
# The default value works out of the box:
#   EXAMPLE_BASE_URL=http://localhost:3000
```

`.env.example` documents all environment variables with placeholder values.
**Never commit `.env`** — it's gitignored.

## 3. Serve the Example App

The example app is a local static HTML page at `apps/example/index.html`.
Serve it with any static file server:

```bash
# Using npx serve (no install needed)
npx serve apps/example -p 3000

# Or with Python
python3 -m http.server 3000 --directory apps/example
```

Open `http://localhost:3000` in a browser. You should see:
- A form with input fields and a submit button
- A data table with rows and columns
- Navigation links

## 4. Understand the App Profile

```bash
cat apps/example/profile.yaml
```

Minimal profile fields (only `name` and `baseUrlEnvVar` required):

```yaml
name: example
baseUrlEnvVar: EXAMPLE_BASE_URL
authMethod: none
testTags: [smoke, demo]
```

## 5. Run the Pipeline

The pipeline is 8 sequential steps invoked as pi slash commands. Run each step
in order within your pi agent session. The agent reads `adapters/pi/capabilities.yaml`
for the command templates.

### Step 1: Resolve Inputs

```
/pipeline-resolve example
```

Validates the app profile, checks `.env` variables, generates a run ID.
Output: `results/example/<run>/step1-resolve/run-metadata.json`

Take note of the `<run>` ID generated — you'll need it for subsequent steps.

### Step 2: Discover UI

```
/pipeline-discover example <run>
```

Navigates to the example app, captures an ARIA snapshot, lists selector candidates.
Output: `results/example/<run>/step2-discover/snapshot.yaml` + `selector-candidates.md`

### Step 3: Extract Selectors

```
/pipeline-extract-selectors example <run>
```

Normalizes selectors using Playwright locator priority (role → testid → label → text → CSS).
Output: `results/example/<run>/step3-extract-selectors/normalized-selectors.md`

### Step 4: Draft Page Object ⚠️ GATED

```
/pipeline-draft-page-object example <run>
```

Generates a TypeScript page object. **The agent will present the draft for your review.**
Read the draft, then reply with one of:
- `approved` — promotes the page object to `src/pages/example/`
- Change feedback (free text) — agent re-drafts (max 3 attempts)

Output (after approval): `src/pages/example/example.page.ts` (with provenance header)

### Step 5: Draft Test Scenarios ⚠️ GATED

```
/pipeline-draft-tests example <run>
```

Generates GWT-style test scenarios. **Review and approve like Step 4.**
Output (after approval): `results/example/<run>/step5-draft-tests/test-draft.md`

### Step 6: Write Playwright Spec

```
/pipeline-write-spec example <run>
```

Generates the Playwright spec from approved page objects and test scenarios.
Output: `tests/example/example.spec.ts`

### Step 7: Run Tests & Fix Script Bugs

```
/pipeline-run-fix example <run>
```

Executes `npx playwright test tests/example/`, triages failures:
- **script_bug**: AI fixes the spec and re-runs
- **app_bug**: reported, not modified

Output: `results/example/<run>/step7-run-fix/test-report.md`, HTML report, traces

### Step 8: Summarize & Update Knowledge

```
/pipeline-summarize example <run>
```

Writes pipeline summary and updates knowledge files with verified observations.
Output: `results/example/<run>/pipeline-summary.md`, updated `knowledge/example/knowledge.md` and `rules.md`

## 6. Review Artifacts

```bash
# List all artifacts from the run
ls -R results/example/<run>/

# View the pipeline summary
cat results/example/<run>/pipeline-summary.md

# View updated knowledge
cat knowledge/example/knowledge.md

# Open the Playwright HTML report
npx playwright show-report results/example/<run>/step7-run-fix/playwright-report/
```

## 7. Run Generated Tests Directly

```bash
# Run the tests created by the pipeline
npx playwright test tests/example/

# Run headed (see the browser)
npm run test:headed

# Run with debugger
npm run test:debug

# View the HTML report
npm run report
```

## 8. Add a New Application

1. Create `apps/<app>/profile.yaml` with `name` and `baseUrlEnvVar`
2. Add the env var to `.env.example` and your local `.env`
3. Run the pipeline: `/pipeline-resolve <app>`, then continue through all 8 steps

No framework code changes needed — the pipeline is app-agnostic.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run typecheck` fails | Run `npm install` and verify `tsconfig.json` is present |
| Example app not reachable | Ensure the static server is running on port 3000 |
| `.env` variable missing | The resolve step reports which variables are missing — add them |
| Tests fail with timeout | The example app may not be running — check Step 3 above |
| Approval stuck | Reply `approved` or provide change feedback (max 3 re-drafts per artifact) |
| Port 3000 in use | Serve on a different port and update `.env` `EXAMPLE_BASE_URL` |
