# Source-flow: apps/automation-in-testing/flows/location-contact-info.yaml

@generated @smoke @public-demo @read-only @location-contact-info
Feature: Location and contact info
  Visitors can see public location and contact information.

  Scenario: Visitor sees public location and contact information
    Given the visitor is on the Shady Meadows B&B home page
    Then the visitor sees the location information
    And the visitor sees the public contact details
