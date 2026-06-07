# Run-ID: 2026-06-06T025645Z
# Approved-at: 2026-06-06T03:06:07Z
# Approved-step: test-draft-review
Feature: Section navigation
  Verify a public visitor can navigate to public page sections from the header navigation.

  Background:
    Given the visitor is on the public home page

  Scenario: Visitor navigates to the Rooms section
    When the visitor clicks the Rooms link in the header navigation
    Then the "Our Rooms" section heading is visible

  Scenario: Visitor navigates to the Booking section
    When the visitor clicks the Booking link in the header navigation
    Then the "Check Availability & Book Your Stay" section heading is visible

  Scenario: Visitor navigates to the Location section
    When the visitor clicks the Location link in the header navigation
    Then the "Our Location" section heading is visible

  Scenario: Visitor navigates to the Contact section
    When the visitor clicks the Contact link in the header navigation
    Then the "Contact Information" section heading is visible
