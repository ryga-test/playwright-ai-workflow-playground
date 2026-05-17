# @provenance runId=2026-05-17T094218Z approvedAt=2026-05-17T09:42:18.000Z gate=test-draft-review sourceFlow=apps/automation-in-testing/flows/room-search.yaml
@smoke @public-demo @read-only @generated @room-search
Feature: Room availability search
  Public visitors need to check available rooms for stay dates without starting or completing a reservation.

  # Source-flow: apps/automation-in-testing/flows/room-search.yaml
  # Flow-ID: room-search
  # Run-ID: 2026-05-17T094218Z
  # Start-path: /#booking
  Scenario: Visitor checks room availability without entering checkout
    Given a public visitor is on the room booking area
    When the visitor searches for availability from "24/05/2026" to "25/05/2026"
    Then the visitor sees room booking options for Single, Double, and Suite rooms
    And the room booking options point to reservation links for the selected dates
    And the visitor remains outside the reservation checkout
