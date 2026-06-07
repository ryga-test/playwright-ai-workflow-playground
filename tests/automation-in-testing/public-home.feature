# Run-ID: 2026-06-07T010736Z
# Approved-at: 2026-06-07T01:12:00Z
# Approved-step: test-draft-review

Feature: Public home
  As a public visitor
  I want to see the Shady Meadows B&B home page introduction and navigation
  So that I can understand what the B&B offers and navigate to different sections

  Background:
    Given the public home page is loaded

  Scenario: Visitor sees the welcome heading
    Then the welcome heading "Welcome to Shady Meadows B&B" is visible

  Scenario: Visitor sees public navigation options
    Then the following navigation links are visible:
      | link     |
      | Rooms    |
      | Booking  |
      | Amenities|
      | Location |
      | Contact  |

  Scenario: Visitor sees the brand logo link
    Then the brand logo link "Shady Meadows B&B" is visible
