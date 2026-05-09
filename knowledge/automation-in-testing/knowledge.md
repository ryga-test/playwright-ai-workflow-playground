# Automation in Testing — Verified Knowledge

> **⚠️ Append-only file.** Add new observations under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate observations already present in the file.

---

## Human-Curated

### App Identity

- Public practice site: `https://automationintesting.online/`
- App slug: `automation-in-testing`
- Base URL env var: `AUTOMATION_IN_TESTING_BASE_URL`

### Testing Policy

- First pipeline run should be read-only public smoke coverage.
- First run may inspect page structure, navigation, listings, forms, and non-submitting validation.
- First run should not submit bookings or contact messages.
- Second and later runs may add safe demo submissions using obvious test data, if the flow does not require real credentials, payment, or email/SMS delivery.

---

## Runs

*(Populated by pipeline runs.)*
