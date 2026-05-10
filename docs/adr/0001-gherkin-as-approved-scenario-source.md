# Gherkin as approved scenario source

Status: accepted

We will replace informal GWT Markdown test drafts with first-class Gherkin `.feature` files as the human-approved behavioral source for generated Playwright specs. We will not add a Cucumber runtime: approved `.feature` files remain review/design artifacts, and Step 6 generates normal `@playwright/test` TypeScript specs from them to preserve the framework's Playwright-first execution model.

## Considered Options

- Keep informal GWT Markdown drafts: simpler, but weaker validation and less consistent scenario quality.
- Adopt Cucumber-style execution: makes Gherkin executable directly, but adds step-definition indirection and moves the framework away from Playwright-first tests.
- Use Gherkin as approved source only: improves review quality and traceability while keeping generated Playwright specs as the executable artifact.

## Consequences

Approved scenarios are promoted to `tests/<app>/<app>.feature` with provenance comments, while generated specs live beside them as `tests/<app>/<app>.spec.ts`. Step 5 must produce `test-scenarios.feature` and `scenario-coverage.md`; Step 6 must preserve traceability from each generated Playwright test to one approved scenario or scenario-outline example row.
