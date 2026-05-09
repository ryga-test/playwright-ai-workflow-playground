# Automation in Testing — Actionable Rules

> **⚠️ Append-only file.** Add new rules under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate rules already present in the file.

---

## Human-Curated

### R01 — First run is read-only smoke

- **Rule**: The first pipeline run for `automation-in-testing` should generate read-only public smoke coverage only.
- **Allowed**: page load, headings, navigation, room/listing visibility, form presence, field visibility, non-submitting validation.
- **Avoid in first run**: final booking submission, contact form submission, admin/login attempts, payment flows, email/SMS dependent assertions.
- **Rationale**: Establish stable selectors and baseline page behavior before adding state-changing demo flows.

### R02 — Later safe demo submissions are allowed

- **Rule**: From the second run onward, safe demo booking/contact submissions may be added with obvious test data.
- **Constraints**: Do not use real credentials, real payment data, or assertions that depend on external email/SMS delivery.
- **Rationale**: The site is intended for practice, but state-changing flows should be introduced after a stable read-only baseline exists.

### R03 — Treat public-site instability as environment/app limitation

- **Rule**: If failures are caused by the public site being down, slow, rate-limited, or externally changed, classify as blocker/app limitation rather than immediately rewriting tests.
- **Rationale**: This app is an external live dependency, not a controlled local fixture.

---

## Runs

*(Populated by pipeline runs.)*
