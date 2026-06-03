# Source-flow: apps/automation-in-testing/flows/policy-links.yaml
# Run-ID: 2026-06-03T075437Z
# Approved-at: 2026-06-03T07:59:00Z
# Approved-step: test-draft-review

@smoke @public-demo @read-only @generated @policy-links
Feature: Policy links
  Public visitors need visible policy links so they can review cookie and privacy information before using the site.

  # Source-flow: apps/automation-in-testing/flows/policy-links.yaml
  # Flow-ID: policy-links
  # Run-ID: 2026-05-17T092115Z
  # Start-path: /
  Scenario: Visitor can see policy links and their destinations without leaving the home page
    Given a public visitor is on the home page
    When the visitor reviews the page footer
    Then the visitor sees a Cookie-Policy link to the cookie policy
    And the visitor sees a Privacy-Policy link to the privacy policy
    And the visitor remains on the home page
