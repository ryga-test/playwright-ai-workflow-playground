# Playwright AI E2E Workflow Playground

This context describes the domain language for an AI-assisted Playwright workflow that discovers an application, drafts human-reviewed behavioral scenarios, generates executable specs, and records verified knowledge.

## Language

**Test Scenario Draft**:
A human-reviewed behavioral source artifact containing Gherkin feature scenarios that describe expected application behavior before Playwright spec generation.
_Avoid_: GWT Markdown, informal Given/When/Then notes

**Approved Feature File**:
The durable `.feature` file promoted from an approved test scenario draft and stored beside the generated Playwright spec.
_Avoid_: Markdown scenario draft, executable test

**Playwright Spec**:
An executable TypeScript test file generated from approved test scenarios and page objects.
_Avoid_: Feature file, scenario draft

## Relationships

- A **Test Scenario Draft** is approved and promoted to an **Approved Feature File** before generating a **Playwright Spec**.
- An **Approved Feature File** and its generated **Playwright Spec** are stored together for the same app.
- A **Playwright Spec** implements scenarios from an **Approved Feature File** with traceable mapping: each generated Playwright test corresponds to exactly one approved Gherkin scenario, or one example row from an approved Gherkin scenario outline.

## Example dialogue

> **Dev:** "Should the agent write the tests directly?"
> **Domain expert:** "No — first it drafts a **Test Scenario Draft** as Gherkin, and only after approval does it generate the **Playwright Spec**."

## Flagged ambiguities

- "GWT test cases" previously meant Markdown-style Given/When/Then notes; resolved: use **Test Scenario Draft** as first-class Gherkin `.feature` content.
