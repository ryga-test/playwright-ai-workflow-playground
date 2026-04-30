# Selector Notes: example

> **⚠️ Append-only file.** Add new findings under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.

---

## Locator Priority

Per constitutional Principle II, locators follow this priority order:

1. **getByRole** — accessible, stable, framework-agnostic (preferred)
2. **getByTestId** — stable when `data-testid` attributes exist
3. **getByLabel** — good for form inputs with associated `<label>` elements
4. **getByPlaceholder** — usable, less stable than labels
5. **getByText** — fragile to content changes
6. **CSS / XPath** — last resort, brittle, document with justification

---

## Human-Curated

*(No human-curated entries yet.)*

---

## Findings

*(Populated by pipeline runs.)*
