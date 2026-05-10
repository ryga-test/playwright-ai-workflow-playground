# Source-flow: apps/automation-in-testing/flows/contact-message.yaml

@generated @smoke @public-demo @read-only @contact-message
Feature: Contact message
  Visitors can prepare a contact message without sending it.

  Scenario: Visitor can prepare a contact message without sending it
    Given the visitor is on the Shady Meadows B&B home page
    When the visitor enters a complete contact message
    Then the contact message remains ready to submit
    And no contact message has been sent
