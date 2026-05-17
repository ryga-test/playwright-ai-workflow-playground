# Source-flow: apps/automation-in-testing/flows/section-navigation.yaml

@smoke @public-demo @read-only @generated @section-navigation
Feature: Section navigation
  Visitors can navigate to public page sections from the header navigation.

  # Source-flow: apps/automation-in-testing/flows/section-navigation.yaml
  # Flow-ID: section-navigation
  # Run-ID: 2026-05-17T100540Z
  # Start-path: /

  Background:
    Given a public visitor is on the Shady Meadows B&B home page

  Scenario Outline: Visitor navigates to a public page section
    When the visitor clicks the "<section>" link in the header navigation
    Then the visitor sees the "<expectedHeading>" section content

    Examples:
      | section  | expectedHeading                     |
      | Rooms    | Our Rooms                           |
      | Booking  | Check Availability & Book Your Stay |
      | Location | Our Location                        |
      | Contact  | Contact Information                 |

  Scenario: Visitor starts from the hero booking call to action
    Given a public visitor is on the Shady Meadows B&B home page
    When the visitor clicks the hero Book Now link
    Then the visitor sees the availability search area
