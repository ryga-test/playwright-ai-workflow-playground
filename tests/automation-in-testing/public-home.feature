# Source-flow: apps/automation-in-testing/flows/public-home.yaml
# Run-ID: 2026-06-03T092756Z
# Approved-at: 2026-06-03T09:39:08Z
# Approved-step: test-draft-review

@generated @smoke @public-demo @read-only @public-home
Feature: Public home
  A public visitor can inspect the Shady Meadows B&B home page introduction
  and confirm the public navigation links are visible.

  Scenario: Visitor sees the welcome heading
    Given the visitor opens the Shady Meadows B&B home page
    When the home page has loaded
    Then the visitor sees the welcome heading "Welcome to Shady Meadows B&B"

  Scenario: Visitor sees public navigation options
    Given the visitor opens the Shady Meadows B&B home page
    When the home page has loaded
    Then the visitor sees the "Rooms" navigation link
    And the visitor sees the "Booking" navigation link
    And the visitor sees the "Amenities" navigation link
    And the visitor sees the "Location" navigation link
    And the visitor sees the "Contact" navigation link

  Scenario: Visitor sees the brand logo link
    Given the visitor opens the Shady Meadows B&B home page
    When the home page has loaded
    Then the visitor sees the "Shady Meadows B&B" brand link
