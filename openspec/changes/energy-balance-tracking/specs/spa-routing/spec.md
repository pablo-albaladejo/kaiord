## ADDED Requirements

### Requirement: Nutrition destination

The SPA SHALL provide a top-level "Nutrition" navigation destination that hosts the
energy-goal setup, intake logger, and energy-balance trends as the primary home for
the feature. The destination SHALL be reachable from the main navigation.

#### Scenario: Navigating to Nutrition

- **WHEN** the user selects "Nutrition" from the main navigation
- **THEN** the Nutrition destination renders with goal, intake, and trends entry points

#### Scenario: Deep link from the Today card

- **GIVEN** the energy-balance card on the Today view
- **WHEN** the user activates the card
- **THEN** the app navigates to the Nutrition destination
