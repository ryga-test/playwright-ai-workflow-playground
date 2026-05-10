# Source-flow: apps/automation-in-testing/flows/section-navigation.yaml

@generated @smoke @public-demo @read-only @section-navigation
Feature: Section navigation
  Visitors can navigate to public page sections.

  Background:
    Given the visitor is on the Shady Meadows B&B home page

  Scenario Outline: Visitor navigates to public page sections
    When the visitor opens the "<section>" section
    Then the visitor sees the "<expectedHeading>" section content

    Examples:
      | section  | expectedHeading                     |
      | Rooms    | Our Rooms                           |
      | Booking  | Check Availability & Book Your Stay |
      | Location | Our Location                        |
      | Contact  | Contact Information                 |

  Scenario: Visitor starts from the hero booking call to action
    When the visitor follows the hero booking call to action
    Then the visitor sees the availability search area
