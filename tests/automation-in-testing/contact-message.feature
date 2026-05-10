# @provenance runId=2026-05-10T132304Z approvedAt=2026-05-10T13:28:00Z gate=test-draft-review
# Source-flow: apps/automation-in-testing/flows/contact-message.yaml
# Draft-run: 2026-05-10T132304Z
# Previous: runId=2026-05-10T125305Z (superseded — 1 scenario → 6 scenarios)

@automation-in-testing @contact-message @smoke @public-demo @read-only @generated
Feature: Contact message preparation
  As a public visitor
  I want to fill out the contact form with my message details
  So that I can review my message before deciding whether to send it

  Background:
    Given the visitor navigates to the contact section of the Shady Meadows B&B site

  @TC-CM-001
  Scenario: Contact form fields accept and retain visitor input
    When the visitor fills the contact form with test data
    Then the contact form fields should retain the entered values

  @TC-CM-002
  Scenario: Submit button is visible and enabled after filling the form
    When the visitor fills the contact form with test data
    Then the Submit button should be visible
    And the Submit button should be enabled

  @TC-CM-003
  Scenario Outline: Individual contact fields persist correctly
    When the visitor fills the contact form with test data
    Then the "<field>" field should contain "<expected>"

    Examples: Contact field values
      | field   | expected                                         |
      | name    | Smoke Test Visitor                               |
      | email   | contact-message-2026-05-10T132304Z@example.test  |
      | phone   | +44 7700 900123                                  |
      | subject | Read-only smoke test                             |
      | message | This is an automated read-only smoke test. The form should not be submitted. |

  @TC-CM-004
  Scenario: Contact form loads empty before interaction
    When the visitor navigates to the contact section
    Then all contact form fields should be empty

  @TC-CM-005
  Scenario: Contact section headings are visible
    Given the visitor navigates to the contact section of the Shady Meadows B&B site
    Then the "Contact Information" heading should be visible
    And the "Send Us a Message" form heading should be visible

  @TC-CM-006
  Scenario: No contact message is submitted during preparation
    When the visitor fills the contact form with test data
    Then the page URL should remain on the public home page
    And no submission confirmation should appear
