# Source-flow: apps/automation-in-testing/flows/room-search.yaml

@generated @smoke @public-demo @read-only @room-search
Feature: Room availability search
  Public visitors want to check available rooms for stay dates without starting or completing a reservation.

  Scenario: Visitor checks room availability without entering checkout
    Given a public visitor is on the room booking area
    When the visitor searches for availability from "17/05/2026" to "18/05/2026"
    Then the visitor sees room booking options for Single, Double, and Suite rooms
    And the visitor remains outside the reservation checkout
