## MODIFIED Requirements

### Requirement: Body-composition goal definition

The system SHALL let a user define an energy goal with a `goalType`
(`fat_loss` | `muscle_gain` | `maintain`), a `startWeightKg`, a `targetWeightKg`,
and a `targetDate`. The goal SHALL be persisted per profile and SHALL travel in
the cloud snapshot; when two devices hold a goal for the same profile, the one
with the newest `updatedAt` SHALL be kept.

#### Scenario: Defining a fat-loss goal

- **GIVEN** a profile at 80 kg
- **WHEN** the user sets a `fat_loss` goal to 70 kg by a date 5 months out
- **THEN** the goal is persisted
- **AND** a daily kcal delta is derived from it
