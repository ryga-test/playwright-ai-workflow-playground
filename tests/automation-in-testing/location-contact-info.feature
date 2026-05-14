# Source-flow: apps/automation-in-testing/flows/location-contact-info.yaml
# Run-ID: 2026-05-14T130209Z
# Approved-at: 2026-05-14T13:25:00.000Z
# Approved-step: test-draft-review
# Tags: @generated @smoke @public-demo @read-only @location-contact-info
Feature: Location and contact information

  As a public visitor
  I want to see location information and public contact details
  So that I can learn about the B&B's whereabouts and how to get in touch.

  Background:
    Given the visitor opens the public home page
    When the visitor navigates to the location section

  @smoke @public-demo @read-only
  Scenario: Location section displays map attribution and contact details
    Then the visitor sees the "Our Location" heading
    And the visitor sees a map attribution link for "Pigeon"
    And the visitor sees a map attribution link for "OpenStreetMap"
    And the visitor sees the "Contact Information" heading
    And the visitor sees the address "Shady Meadows B&B, Shadows valley, Newingtonfordburyshire, Dilbery, N1 1AA"
    And the visitor sees the phone number "012345678901"
    And the visitor sees the email address "fake@fakeemail.com"
