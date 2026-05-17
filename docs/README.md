# Playwright AI Workflow Playground

This repo is a TypeScript + Playwright playground for testing how AI agents can help build end-to-end tests.

The main idea is simple: point the framework at a web app, let an agent inspect the UI, generate selectors, draft a page object, draft test scenarios, write a Playwright spec, run it, fix script bugs, then summarize what it learned.

The useful part is not that an AI writes a test. The useful part is that every step leaves reviewable artifacts, and the two risky steps require human approval before generated code is promoted into the repo.

## Who this repo is for

Use this if you are:

- evaluating AI-assisted E2E testing workflows
- building Playwright conventions for multiple apps
- comparing selector extraction, page object generation, and test generation quality
- looking for a concrete pi slash-command workflow you can adapt
- trying to keep generated test code reviewable instead of letting an agent edit everything at once

If you only want a basic Playwright starter, this is probably more machinery than you need.

## What is included

- A strict TypeScript Playwright project
- A local static example app in `apps/example/`
- App profiles in `apps/<app>/profile.yaml`
- An 8-step AI pipeline defined in `workflows/manifest.yaml`
- pi slash-command prompts in `.pi/prompts/`
- A pi pipeline runner extension in `.pi/extensions/pipeline-runner/`
- Human approval gates for generated page objects and Gherkin test scenario drafts
- Gherkin `.feature` scenario sources with scenario coverage mapping
- Per-flow run artifacts under `results/<app>/flows/<flow-id>/<run>/`
- App knowledge files under `knowledge/<app>/`
- Automated six-run pruning for stale knowledge, with archive and audit log
- A self-contained QA dashboard in `index.html`

## Requirements

- Node.js 18+
- npm
- Chromium installed through Playwright
- A pi agent session if you want to run the AI pipeline

You can run the generated Playwright tests without pi. The 8-step AI pipeline requires pi because the workflow is implemented as slash-command prompts and a pi extension.

## Get the example app running

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run typecheck
```

Start the bundled example app:

```bash
python3 -m http.server 3000 --directory apps/example
```

Open `http://localhost:3000`. You should see a small app with a profile form, a status table, and navigation links.

The default `.env.example` already points the example profile at that URL:

```env
EXAMPLE_BASE_URL=http://localhost:3000
```

Never commit `.env`, credentials, cookies, tokens, storage state, customer data, or private URLs.

## Run the AI pipeline

The easiest path is the pipeline runner extension:

```text
/pipeline-run automation-in-testing FLOW_ID=room-search
```

That command creates a run ID, creates a git branch named `pipeline/<app>/<flow-id>/<runId>`, switches to it, and starts the 8-step workflow. The pipeline validates the selected flow file, keeps discovery/page objects app-level, and drafts/writes/runs tests for exactly one flow.

Non-gated steps continue automatically. The pipeline pauses twice:

1. Step 4, page object draft review
2. Step 5, test scenario draft review

At each gate, read the draft in chat and approve it with:

```text
/pipeline-continue
```

or give feedback in chat. The agent can re-draft up to 3 times.

Useful extension commands:

| Command | What it does |
|---|---|
| `/pipeline-run <app> FLOW_ID=<flow-id>` | Starts a full pipeline run for one flow on a new git branch |
| `/pipeline-continue` | Sends `approved` at the current gate and advances |
| `/pipeline-status` | Shows current run state |
| `/pipeline-reset` | Aborts the run, switches back, and deletes the pipeline branch |

When the run finishes, you stay on the pipeline branch so you can inspect the diff before committing or merging.

## The 8 pipeline steps

| # | Step | Output | Human gate |
|---|---|---|:---:|
| 1 | Resolve inputs | Validated app profile, run metadata, flow inventory, resolved test data | No |
| 2 | Discover UI | Shared per-path/merged Playwright ARIA snapshots and selector candidates | No |
| 3 | Extract selectors | Normalized selector list with locator priority and path/flow provenance | No |
| 4 | Draft page object | Shared TypeScript page object draft | Yes |
| 5 | Draft tests | Per-flow Gherkin `.feature` scenarios + scenario coverage | Yes |
| 6 | Write spec | Per-flow Playwright specs in `tests/<app>/` | No |
| 7 | Run and fix | Per-flow test reports, aggregate report, Playwright report, traces, videos | No |
| 8 | Summarize | Pipeline summary, flow summaries, knowledge updates, active summary, and pruning audit | No |

Selector priority is role, test id, label, placeholder, text, then CSS or XPath as a last resort.

## What a run produces

Each run writes artifacts under `results/<app>/flows/<flow-id>/<run>/`:

```text
results/automation-in-testing/flows/room-search/2026-05-01T123456Z/
├── pipeline-summary.md
├── resolved-test-data.json
├── test-scenarios.feature
├── scenario-coverage.md
├── flow-summary.md
├── step1-resolve/run-metadata.json
├── step1-resolve/flow-inventory.json
├── step2-discover/paths/<path-label>.snapshot.yaml
├── step2-discover/snapshot.merged.yaml
├── step2-discover/selector-candidates.md
├── step3-extract-selectors/normalized-selectors.md
├── step4-draft-page-object/page-object.draft.ts
├── step5-draft-tests/test-drafts-index.md
└── step7-run-fix/
    ├── test-report.md
    ├── playwright-report/
    └── <test-name>.webm
```

Approved generated artifacts land in the normal source tree:

- `src/pages/<app>/<app>.page.ts`
- `tests/<app>/<flow-id>.feature` for flow-based apps, or `tests/<app>/<app>.feature` in legacy app-level mode
- `tests/<app>/<flow-id>.spec.ts` for flow-based apps, or `tests/<app>/<app>.spec.ts` in legacy app-level mode
- `knowledge/<app>/knowledge.md`
- `knowledge/<app>/rules.md`

Step 8 also maintains the active knowledge set:

- `knowledge/<app>/current.md`, compact context for future runs
- `knowledge/<app>/archive.md`, entries removed from active knowledge
- `knowledge/<app>/prune-log.md`, evidence for every automated prune

Promoted files include a provenance header with the run ID, approval timestamp, and gate name.

## Gherkin scenario guidelines

Step 5 drafts Gherkin `.feature` files as the human-approved behavioral source. These files are review/design artifacts: the project does **not** use a Cucumber runtime. Step 6 generates normal `@playwright/test` TypeScript specs from approved scenarios.

The local rules live in `docs/gherkin-guidelines.md`. They are adapted from Automation Panda's [Gherkin Guidelines for AI](https://github.com/AutomationPanda/gherkin-guidelines-for-ai) — tribute and thanks to the original project for the guidance.

Key rules:

- write user-goal scenarios, not UI mechanics
- avoid Playwright APIs, page-object method names, CSS, and XPath in Gherkin
- map every scenario or scenario-outline example row in `scenario-coverage.md`
- preserve traceability from approved scenarios to generated Playwright tests

## How knowledge stays current

The pipeline treats knowledge like code: useful when it is current, dangerous when it quietly rots.

Step 8 appends only observations verified by passing Playwright tests. It then checks the app's active knowledge against the last six successful runs. If an entry has been contradicted or superseded across those runs, the agent removes it from the active knowledge file, moves it to `archive.md`, and records the evidence in `prune-log.md`.

A missing mention is not enough to delete something. The agent needs evidence that the old entry is wrong or replaced. `## Human-Curated` sections are never pruned automatically.

Future runs should read `knowledge/<app>/current.md` first, then open the raw files when they need provenance.

## Run the generated tests yourself

After a pipeline run, or after editing generated tests:

```bash
npx playwright test tests/example/
APP_NAME=automation-in-testing FLOW_ID=room-search npm test
npm run test:headed
npm run test:debug
npm run report
```

## View the QA dashboard

```bash
npm run dashboard
```

The dashboard reads completed runs from `results/`, updates `index.html`, and opens it in your browser. It shows pass rate, duration trend, slowest specs, historical comparison, and artifact inventory.

## Add another application

Create a profile:

```yaml
# apps/my-app/profile.yaml
name: my-app
baseUrlEnvVar: MY_APP_BASE_URL
authMethod: none
testTags: [smoke]
```

Add the URL placeholder to `.env.example` and the real local value to `.env`:

```env
MY_APP_BASE_URL=http://localhost:3001
```

Then run:

```text
/pipeline-run my-app FLOW_ID=<flow-id>
```

No framework source changes should be needed. App-specific output stays under:

- `src/pages/my-app/`
- `tests/my-app/`
- `knowledge/my-app/`
- `results/my-app/flows/<flow-id>/`

## Project map

```text
apps/<app>/              App profiles and local example pages
adapters/<agent>/        Agent capability mappings
workflows/manifest.yaml  Agent-neutral 8-step workflow
.pi/prompts/             pi slash-command prompts
.pi/extensions/          pi automation extensions
src/pages/<app>/         Approved page objects
src/fixtures/            Shared Playwright fixtures
tests/<app>/             Approved .feature files and generated Playwright specs
knowledge/<app>/         Active knowledge, pruning archive, and audit log
results/<app>/flows/     Per-flow run artifacts, gitignored
contracts/               YAML schemas
docs/                    Project documentation
```

## Manual command mode

If you do not use `/pipeline-run`, you can run the step commands yourself in pi. Generate a run ID first, for example `2026-05-01T123456Z`, then run:

```text
/pipeline-resolve automation-in-testing 2026-05-01T123456Z
/pipeline-discover automation-in-testing 2026-05-01T123456Z
/pipeline-extract-selectors automation-in-testing 2026-05-01T123456Z
/pipeline-draft-page-object automation-in-testing 2026-05-01T123456Z
/pipeline-draft-tests automation-in-testing 2026-05-01T123456Z
/pipeline-write-spec automation-in-testing 2026-05-01T123456Z
/pipeline-run-fix automation-in-testing 2026-05-01T123456Z
/pipeline-summarize automation-in-testing 2026-05-01T123456Z
```

Include `FLOW_ID: <flow-id>` in the context for each manual step, and run the resolver as:

```bash
node scripts/resolve-flows.js automation-in-testing 2026-05-01T123456Z room-search
```

Use the same run ID for every step.

## More docs

- Spec: `specs/001-ai-e2e-framework/spec.md`
- Quickstart: `specs/001-ai-e2e-framework/quickstart.md`
- Implementation plan: `specs/001-ai-e2e-framework/plan.md`
- Design decisions: `DESIGN_DECISIONS.md`
- pi adapter notes: `adapters/pi/README.md`
- Gherkin guidelines: `docs/gherkin-guidelines.md`
- Multi-flow pipeline design: `docs/multi-flow-pipeline.md`
- Gherkin source ADR: `docs/adr/0001-gherkin-as-approved-scenario-source.md`
