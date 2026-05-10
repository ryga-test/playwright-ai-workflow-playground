# Generated-by: pipeline
# Run-ID: 2026-05-10T004617Z
# Approved-at: 2026-05-10T00:50:04Z
# Approved-step: test-draft-review

@generated @smoke @public-demo @read-only
Feature: Public bed and breakfast home page
  Visitors can inspect public information, navigate page sections, search availability, and prepare a contact message without completing a booking or sending a message.

  Background:
    Given the visitor is on the Shady Meadows B&B home page

  Scenario: Visitor sees the public home page introduction
    Then the visitor sees the Shady Meadows B&B welcome heading
    And the visitor sees the public navigation options

  Scenario Outline: Visitor navigates to public page sections
    When the visitor opens the "<section>" section
    Then the visitor sees the "<expectedHeading>" section content

    Examples:
      | section   | expectedHeading                    |
      | Rooms     | Our Rooms                          |
      | Booking   | Check Availability & Book Your Stay |
      | Location  | Our Location                       |
      | Contact   | Contact Information                |

  Scenario: Visitor starts from the hero booking call to action
    When the visitor follows the hero booking call to action
    Then the visitor sees the availability search area

  Scenario: Visitor checks room availability for selected dates
    When the visitor searches availability for "10/05/2026" to "11/05/2026"
    Then the visitor still sees room booking options

  Scenario Outline: Visitor sees each public room type
    Then the visitor sees the "<roomType>" room option

    Examples:
      | roomType |
      | Single   |
      | Double   |
      | Suite    |

  Scenario: Visitor can prepare a contact message without sending it
    When the visitor enters a complete contact message
    Then the contact message remains ready to submit
    And no contact message has been sent

  Scenario: Visitor sees public location and contact information
    Then the visitor sees the location information
    And the visitor sees the public contact details

  Scenario: Visitor can access public policy links
    Then the visitor can access the cookie policy link
    And the visitor can access the privacy policy link
