# Run-ID: 2026-06-07T005234Z
# Approved-at: 2026-06-07T00:58:57Z
# Approved-step: test-draft-review

Feature: Policy links
  As a public visitor
  I want to see policy links on the home page
  So that I can access cookie and privacy policies

  Background:
    Given the visitor navigates to the home page

  Scenario: Visitor sees the cookie policy link with the expected href
    Then the footer contains a "Cookie-Policy" link
    And the "Cookie-Policy" link href is "/cookie"

  Scenario: Visitor sees the privacy policy link with the expected href
    Then the footer contains a "Privacy-Policy" link
    And the "Privacy-Policy" link href is "/privacy"
