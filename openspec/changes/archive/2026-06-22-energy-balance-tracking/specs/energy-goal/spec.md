## ADDED Requirements

### Requirement: Body-composition goal definition

The system SHALL let a user define an energy goal with a `goalType`
(`fat_loss` | `muscle_gain` | `maintain`), a `startWeightKg`, a `targetWeightKg`,
and a `targetDate`. The goal SHALL be persisted device-locally per profile and
excluded from the cloud snapshot.

#### Scenario: Defining a fat-loss goal

- **GIVEN** a profile at 80 kg
- **WHEN** the user sets a `fat_loss` goal to 70 kg by a date 5 months out
- **THEN** the goal is persisted
- **AND** a daily kcal delta is derived from it

### Requirement: Safe daily delta derivation

For a `fat_loss` goal the system SHALL derive the daily deficit from the total energy
gap (`(startKg − targetKg) · 7700`) divided by the days to target, and for a
`muscle_gain` goal a conservative daily surplus. The system SHALL apply default safety
caps (deficit ≤ ~0.75%/week of bodyweight, never below BMR or a kcal floor; muscle
gain ≤ 0.5 kg/month) and SHALL warn — but not block — when a user overrides a cap.

#### Scenario: Aggressive goal is capped with a warning

- **GIVEN** a goal whose implied deficit exceeds the safe weekly cap
- **WHEN** the daily delta is derived
- **THEN** the delta is clamped to the safe cap by default
- **AND** the UI shows a warning explaining the cap

#### Scenario: User overrides the cap

- **WHEN** the user explicitly overrides the safety cap
- **THEN** the system applies the user's value
- **AND** continues to display the unsafe-goal warning

### Requirement: Periodized daily target

The system SHALL compute a per-day kcal target as
`BMR + expectedActivityKcal(day) + dailyDelta`, so that higher-expenditure (sport)
days receive a higher target while the weekly net delta is held constant.

#### Scenario: Hard sport day gets a higher target

- **GIVEN** a goal with a fixed daily deficit and a week with one high-load session
- **WHEN** per-day targets are computed
- **THEN** the high-load day's kcal target exceeds a rest day's target
- **AND** the week's net delta equals the configured weekly delta

### Requirement: Macro target derivation

From the goal and bodyweight the system SHALL derive protein (1.6–2.4 g/kg, higher on
a deficit), a fat floor (≥ 0.6–0.8 g/kg), and carbohydrates as the remaining kcal,
scaled up on high-load days.

#### Scenario: Deriving macro targets on a deficit

- **GIVEN** a `fat_loss` goal and a bodyweight
- **WHEN** macro targets are derived
- **THEN** protein is at the higher end of the range
- **AND** fat is at or above the floor
- **AND** carbohydrates account for the remaining target kcal
