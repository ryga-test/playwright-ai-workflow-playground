# Source-flow: apps/automation-in-testing/flows/public-home.yaml

@generated @smoke @public-demo @read-only @public-home
Feature: Public home
  Visitors can inspect the public Shady Meadows B&B home page introduction.

  Scenario: Visitor sees the public home page introduction
    Given the visitor is on the Shady Meadows B&B home page
    Then the visitor sees the Shady Meadows B&B welcome heading
    And the visitor sees the public navigation options
