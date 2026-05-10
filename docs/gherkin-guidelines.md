# Gherkin Guidelines for AI-Generated Scenarios

These project rules adapt the Automation Panda Gherkin guidance for this Playwright AI workflow. Source attribution: https://github.com/AutomationPanda/gherkin-guidelines-for-ai/blob/main/gherkin-guidelines.md

## Purpose

Gherkin `.feature` files are human-approved behavioral source artifacts. They are not executed by Cucumber. Step 6 generates normal `@playwright/test` TypeScript specs from approved feature files.

## Required rules

- Use valid `.feature` structure with one `Feature:` and at least one `Scenario:` or `Scenario Outline:`.
- Write scenarios around user goals and observable behavior, not UI mechanics.
- Use Given/When/Then steps for each scenario.
- Keep Gherkin free of Playwright APIs, page-object method names, CSS selectors, XPath selectors, and implementation details.
- Ground scenarios only in discovery artifacts, approved knowledge, rules, and explicit user input.
- Do not invent business rules. Capture uncertain or non-automatable behavior outside the approved feature file.
- Every scenario, or every `Scenario Outline` example row, must map to generated Playwright tests with traceability.

## Allowed conventions

- `Scenario Outline` is allowed when the same behavior is checked with multiple meaningful examples.
- `Background` is allowed only for preconditions shared by every scenario; do not use it for setup mechanics.
- `Rule:` is allowed when there is a real business rule, but it is not required.
- Tags are allowed for useful metadata such as app profile tags, `@smoke`, `@regression`, or `@generated`.

## Avoid

```gherkin
When I click #submit-btn
Then I expect getByRole("status") to contain text
```

Prefer:

```gherkin
When the visitor submits a valid contact request
Then the visitor sees a confirmation message
```

## Companion coverage artifact

Step 5 must produce `scenario-coverage.md` beside `test-scenarios.feature`. The coverage file maps each scenario or scenario-outline example row to discovered interactive elements and explains any discovered element intentionally not covered.
