<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial constitution)
  MAJOR bump: first complete constitution filling all placeholder slots

  Modified principles:
    - [PRINCIPLE_1_NAME] → I. Playwright Best Practices First
    - [PRINCIPLE_2_NAME] → II. AI-Native Architecture
    - [PRINCIPLE_3_NAME] → III. Test-First (NON-NEGOTIABLE)
    - [PRINCIPLE_4_NAME] → IV. Full Documentation
    - [PRINCIPLE_5_NAME] → V. Multi-Agent & Multi-Workflow Ready

  Added sections:
    - Technology & Standards (replacing SECTION_2)
    - Development Workflow (replacing SECTION_3)
    - Governance (expanded from template)

  Removed sections: none

  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ no changes needed (Constitution Check gate is generic)
    - .specify/templates/spec-template.md: ✅ no changes needed (requirements format aligns)
    - .specify/templates/tasks-template.md: ✅ no changes needed (test-first phases align)
    - .specify/templates/checklist-template.md: ✅ no changes needed (generic)
    - AGENTS.md: ✅ no changes needed (refers to current plan)

  Follow-up TODOs: none — all placeholders resolved
-->

# PW AI POC Constitution

## Core Principles

### I. Playwright Best Practices First

All test code MUST follow official Playwright patterns and conventions as
documented in the Playwright docs and official repositories:

- Page Object Model (POM) for UI abstraction; page objects encapsulate
  locators and actions, never exposing raw selectors
- Built-in auto-waiting and web-first assertions; no manual `sleep()`,
  `waitForTimeout()`, or explicit wait calls except where Playwright
  provides no alternative (justified case-by-case)
- Semantic locators (`getByRole`, `getByLabel`, `getByTestId`) over CSS/XPath
  selectors; `data-testid` as the preferred custom attribute for when
  semantic locators are insufficient
- Fixture-based configuration via `playwright.config.ts`; environment-agnostic
  base URL, viewport, and browser settings
- Tests MUST be isolated: each test sets up its own state, no cross-test
  dependencies or shared mutable state
- Trace, screenshot, and video capture configured for CI debugging

**Rationale**: Playwright's official patterns are the result of years of
battle-testing by the core team and community. Deviating without strong
justification reintroduces flakiness and maintenance burden that Playwright
was designed to eliminate.

### II. AI-Native Architecture

The framework is designed to be operated, extended, and maintained by AI
agents (pi, Claude, Codex). Code and project structure MUST prioritize
machine readability without sacrificing human readability:

- File and directory naming MUST be predictable and descriptive:
  `pages/LoginPage.ts`, `tests/login.spec.ts`, `fixtures/auth.fixture.ts`
- Test names MUST describe the scenario in plain language: "user can log in
  with valid credentials" not "test_login_01"
- Page object methods MUST use verb-noun naming: `clickSubmit()`,
  `fillSearchInput(value)`, `getErrorMessage()`
- Configuration MUST be explicit: no magic constants, no environment
  variables referenced without being declared in config or `.env.example`
- Project conventions MUST be documented in AGENTS.md (context file) so
  every AI agent receives consistent behavioral guidance
- Every test file MUST declare its purpose in a top-level `test.describe`
  block with a human-readable description

### III. Test-First (NON-NEGOTIABLE)

All workflow development MUST follow the Red-Green-Refactor cycle:

1. **Define acceptance criteria** in the feature spec (Given/When/Then)
2. **Write tests** that encode those criteria → verify they FAIL
3. **Implement** page objects, fixtures, and utilities needed — stop when
   tests pass
4. **Refactor** for readability and reuse while keeping tests green
5. Tests MUST be reviewed and approved by a human or AI reviewer before
   implementation begins

No production/utility code may be written before its corresponding test
exists. Shared fixtures and page objects may be extracted during refactoring
once at least two test files demonstrate the same need.

**Rationale**: Test-first ensures every line of framework code has a
demonstrable purpose. In an AI-native framework where agents generate and
modify tests, passing tests are the contract that constrains behavior.

### IV. Full Documentation

Every component of the framework MUST be documented sufficiently that a new
AI agent (or human developer) can understand its purpose, usage, and
constraints without reading implementation details:

- Page objects: JSDoc/TSDoc on every public method, describing parameters,
  return values, and preconditions
- Fixtures: documented with setup/teardown lifecycle, required config keys,
  and intended usage scope
- Workflow scripts: top-level comment block explaining the workflow name,
  steps, dependencies, and expected outputs
- Project README: framework overview, setup instructions, how to run tests,
  how to add new workflows, agent-specific guidance
- Complex logic: inline comments explaining WHY, not WHAT (code says what)
- Configuration files: every non-obvious option MUST have a comment

### V. Multi-Agent & Multi-Workflow Ready

The framework MUST support concurrent and independent use by multiple AI
agents (pi, Claude, Codex) across multiple test workflows:

- Workflows MUST be isolated: each workflow lives in its own directory under
  `workflows/<name>/` with its own pages, tests, fixtures, and docs
- Shared infrastructure (e.g., authentication fixtures, API clients) MUST
  live in `shared/` and be imported by workflows
- Workflows MUST NOT import from other workflows — only from `shared/` or
  their own directory
- Test runs MUST be independently executable: `npx playwright test
  workflows/<name>/` works without running other workflows
- Agent-specific configurations (if any) MUST be opt-in via environment
  variables or separate config profiles, never hardcoded
- CI MUST run all workflows and report per-workflow pass/fail

## Technology & Standards

**Language**: TypeScript (strict mode). JavaScript allowed only for
configuration files where TypeScript is not supported by the tool.

**Primary Dependencies**:
- `@playwright/test` — test runner and assertions (latest stable)
- `dotenv` — environment variable management
- `eslint` + `@typescript-eslint` + `prettier` — code quality
- `tsx` — TypeScript execution for scripts (if needed)

**Project Type**: Test automation framework (single project structure).
```
workflows/
├── <workflow-name>/
│   ├── pages/         # Page Objects for this workflow
│   ├── tests/         # Playwright test specs
│   ├── fixtures/      # Workflow-specific fixtures
│   └── README.md      # Workflow documentation
shared/
├── pages/             # Shared Page Objects (e.g., login)
├── fixtures/          # Shared fixtures (e.g., auth)
└── utils/             # Shared utilities and helpers
playwright.config.ts   # Global Playwright configuration
AGENTS.md              # AI agent context and conventions
```

**Testing**: `@playwright/test` with HTML, JSON, and JUnit reporters.
Traces enabled on first retry. Screenshots on failure.

**Performance Goals**: CI pipeline completes full suite in under 10 minutes
(parallel workers). Individual test files <60s each.

**Constraints**: No external services required for test execution. Mock APIs
using Playwright's `page.route()` where external dependencies exist.

## Development Workflow

**Spec-First Development**: All features follow the .specify SDD cycle:
Specify → Plan → Tasks → Implement. Constitution compliance is checked at
the Plan gate.

**Branch Strategy**: Sequential branch numbering (`001-feature-name`) via
`speckit.git.feature`. Work in feature branches, merge on completion.

**AI Agent Collaboration**:
- pi: primary development agent (spec writing, implementation)
- claude, codex: secondary agents for code generation, review, test writing
- Agents operate on separate workflows or separate files within a workflow
  to avoid conflicts
- All agent-generated code MUST pass existing tests and the lint gate

**Quality Gates** (before merge):
1. All tests pass (`npx playwright test`)
2. Linting passes (`npm run lint`)
3. TypeScript compiles without errors (`npx tsc --noEmit`)
4. Constitution compliance verified against .specify plan
5. Documentation updated for any new or changed workflows

## Governance

This Constitution supersedes all other development practices, conventions,
and guidelines for the PW AI POC project. Where another document conflicts,
the Constitution takes precedence.

**Amendment Process**:
1. Propose changes via feature branch with rationale in commit message
2. Amendments must document: what changes, why, and migration plan for
   affected workflows
3. All amendments require review by at least one human or AI reviewer
4. Constitution version MUST be incremented per semantic versioning:
   - MAJOR: Principle removal, redefinition, or governance change that
     breaks backward compatibility
   - MINOR: New principle or section added, material expansion of guidance
   - PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance**:
- Every `.specify/plan` execution MUST include a Constitution Check gate
- Every PR/review MUST verify alignment with all applicable principles
- Violations require explicit justification documented in the plan's
  Complexity Tracking table
- Repeated unjustified violations are grounds for rejecting the feature

**Version**: 1.0.0 | **Ratified**: 2026-04-29 | **Last Amended**: 2026-04-29
