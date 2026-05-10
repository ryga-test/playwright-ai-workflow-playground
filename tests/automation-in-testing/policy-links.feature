# Source-flow: apps/automation-in-testing/flows/policy-links.yaml

@generated @smoke @public-demo @read-only @policy-links
Feature: Policy links
  Visitors can inspect public policy link destinations.

  Scenario: Visitor can access public policy links
    Given the visitor is on the Shady Meadows B&B home page
    Then the visitor can access the cookie policy link
    And the visitor can access the privacy policy link
