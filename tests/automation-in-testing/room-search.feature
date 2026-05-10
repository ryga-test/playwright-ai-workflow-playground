# Source-flow: apps/automation-in-testing/flows/room-search.yaml

@generated @smoke @public-demo @read-only @room-search
Feature: Room search
  Visitors can check room availability without completing a reservation.

  Scenario: Visitor checks room availability for selected dates
    Given the visitor is on the Shady Meadows B&B home page
    When the visitor searches availability for relative stay dates
    Then the visitor still sees room booking options
    And the visitor remains outside reservation checkout
