# Source-flow: apps/automation-in-testing/flows/room-display.yaml

@generated @smoke @public-demo @read-only @room-display
Feature: Room display
  Visitors can see public room options without starting checkout.

  Background:
    Given the visitor is on the Shady Meadows B&B home page

  Scenario Outline: Visitor sees each public room type
    Then the visitor sees the "<roomType>" room option

    Examples:
      | roomType |
      | Single   |
      | Double   |
      | Suite    |
