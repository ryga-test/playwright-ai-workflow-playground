# Playwright AI Workflow Playground

A generic TypeScript + Playwright framework for AI-assisted end-to-end testing workflows across multiple web applications. Each app keeps its own profile, page objects, tests, knowledge, and run artifacts. The pipeline runs as 8 pi slash commands with human review gates on page object and test scenario drafts.

## Prerequisites

- Node.js 18+
- npm
- A pi agent session (for pipeline slash commands)

## Quick Start

```bash
npm install
npx playwright install chromium
npm run typecheck
```

Start the example app:

```bash
python3 -m http.server 3000 --directory apps/example
```

Open `http://localhost:3000`. The page includes a profile form, status table, and navigation links.

## 8-Step Pipeline

Invoke each step in order within a pi agent session. Type `/pipeline-` and autocomplete shows all commands numbered (1/8) through (8/8).

| # | Command | Args | Gated |
|---|---------|------|:-----:|
| 1 | `/pipeline-resolve` | `<app>` | No |
| 2 | `/pipeline-discover` | `<app> <run>` | No |
| 3 | `/pipeline-extract-selectors` | `<app> <run>` | No |
| 4 | `/pipeline-draft-page-object` | `<app> <run>` | **Yes** |
| 5 | `/pipeline-draft-tests` | `<app> <run>` | **Yes** |
| 6 | `/pipeline-write-spec` | `<app> <run>` | No |
| 7 | `/pipeline-run-fix` | `<app> <run>` | No |
| 8 | `/pipeline-summarize` | `<app> <run>` | No |

**Step 1** generates a run ID (ISO 8601 timestamp). Use it in steps 2–8.

**Steps 4 and 5 are gated**: the AI presents the draft in chat. Reply `approved` to promote to source directories, or give feedback for re-draft (max 3 attempts). Promoted artifacts carry provenance headers.

## Pipeline Automation Extension

A pi extension (`.pi/extensions/pipeline-runner/`) automates the pipeline so you don't need to invoke each step manually. Non-gated steps chain automatically; gated steps pause for human approval.

### Commands

| Command | Action |
|---|---|
| `/pipeline-run <app>` | Starts from step 1, auto-chains through 2→3, pauses at gate |
| `/pipeline-continue` | Sends `approved` to the agent (promotes gated artifacts), then advances |
| `/pipeline-status` | Shows current step, run ID, gate approval state |
| `/pipeline-reset` | Aborts the current pipeline |

### Pipeline Flow

```
Step 1 (resolve)     ─── auto ──→ 2 (discover) ─── auto ──→ 3 (selectors)
                                                               │
                                                    ┌──────────┘
                                                    ▼
                                              Step 4 (page object)
                                              ⏸ GATED — agent presents draft,
                                                 pauses for human review
                                                    │
                                        /pipeline-continue
                                        → sends "approved"
                                        → agent promotes to src/pages/
                                                    │
                                                    ▼
                                              Step 5 (draft tests)
                                              ⏸ GATED — agent presents scenarios,
                                                 pauses for human review
                                                    │
                                        /pipeline-continue
                                        → sends "approved"
                                        → agent marks approved
                                                    │
                                                    ▼
                                        Step 6 (write spec) ──→
                                        Step 7 (run-fix)    ──→
                                        Step 8 (summarize)  ──→ 🎉 DONE
```

**How it works:**
- Listens for `agent_end` to detect when each step completes, then dispatches the next.
- After step 1, scans `results/<app>/` to extract the run ID for steps 2–8.
- Pipeline state persists across pi session restarts via `pi.appendEntry`.
- `/pipeline-continue` sends the `approved` keyword so the agent promotes the page object to `src/pages/` and marks the test draft approved before continuing.

## Gated Approval Flow

```
AI drafts page object / test scenarios
    → presents full text inline
    → human replies:
        "approved"           → promoted to src/ or tests/ with provenance header
        <change feedback>    → AI re-drafts (max 3 cycles)
```

## Pipeline Run Output

Every run writes canonical artifacts under `results/<app>/<run>/`:

```
results/example/2026-04-30T093928Z/
├── pipeline-summary.md
├── step1-resolve/run-metadata.json
├── step2-discover/snapshot.yaml, selector-candidates.md
├── step3-extract-selectors/normalized-selectors.md
├── step4-draft-page-object/page-object.draft.ts
├── step5-draft-tests/test-draft.md
└── step7-run-fix/test-report.md, playwright-report/
```

After the pipeline completes, run the generated tests directly:

```bash
npx playwright test tests/example/
npm run test:headed
npm run test:debug
npm run report
```

## Project Structure

```
├── apps/<app>/              # App profiles + static pages
│   └── example/profile.yaml, index.html
├── adapters/<agent>/        # Agent-specific capabilities
│   └── pi/capabilities.yaml, README.md
├── workflows/manifest.yaml  # 8-step neutral pipeline definition
├── .pi/prompts/             # pi prompt templates (slash commands)
├── src/
│   ├── pages/<app>/         # Promoted page objects
│   ├── fixtures/            # Shared Playwright fixtures
│   ├── helpers/             # Profile loader, artifact writer, snapshot parser
│   └── types/               # Shared TypeScript interfaces
├── tests/<app>/             # Generated Playwright specs
├── knowledge/<app>/         # Verified observations, rules, selector notes
├── results/<app>/           # Run artifacts (gitignored)
├── contracts/               # YAML schemas (profiles, manifest, adapter, locks)
└── docs/                    # Framework documentation
```

## Environment

```bash
cp .env.example .env
```

`.env.example` documents all variables with safe placeholders. Never commit real credentials, cookies, tokens, storage state, or customer data.

## Adding a New Application

1. Create `apps/<app>/profile.yaml` — only `name` and `baseUrlEnvVar` required.
2. Add the env var to `.env.example` and `.env`.
3. Run the pipeline: `/pipeline-resolve <app>` and continue through all 8 steps.

No framework code changes needed.

## npm Scripts

| Script | Command |
|--------|---------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `npx playwright test` |
| `npm run test:headed` | `npx playwright test --headed` |
| `npm run test:debug` | `npx playwright test --debug` |
| `npm run report` | `npx playwright show-report` |
| `npm run lint` | ESLint placeholder |

## Documentation

- Full spec: `specs/001-ai-e2e-framework/spec.md`
- Quickstart: `specs/001-ai-e2e-framework/quickstart.md`
- Implementation plan: `specs/001-ai-e2e-framework/plan.md`
- Design decisions: `DESIGN_DECISIONS.md`
- pi adapter: `adapters/pi/README.md`
