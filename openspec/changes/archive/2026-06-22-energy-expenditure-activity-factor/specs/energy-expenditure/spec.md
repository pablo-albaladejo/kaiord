## MODIFIED Requirements

<!-- MODIFIED FROM openspec/specs/energy-expenditure / Requirement: Daily expenditure resolution. The full prior block is reproduced below; the predicted basal is now BMR scaled by the profile's activity-level NEAT factor instead of the raw BMR. Scheduled-workout kcal are still added separately via expectedActivityKcal and MUST NOT be double-counted. The two prior scenarios are preserved; two new scenarios assert the NEAT scaling and the no-double-count invariant (issue #804). -->

### Requirement: Daily expenditure resolution

The system SHALL resolve a day's total energy expenditure as measured
(`restingCalories + activeCalories`) when a connection covers that day, and as
predicted (`BMR × activityFactor + expectedActivityKcal`) otherwise, where
`activityFactor` is the profile's activity-level NEAT multiplier
(`sedentary` 1.2, `light` 1.3, `moderate` 1.4, `active` 1.5, `very_active` 1.6;
defaulting to 1.2 when the activity level is unset). These NEAT factors cover
non-exercise daily movement only; scheduled-workout energy is added separately
via `expectedActivityKcal` and SHALL NOT be double-counted. Each resolved value
SHALL be labelled `measured`, `predicted`, or `mixed`. The measured path SHALL
ignore the activity factor.

#### Scenario: Measured expenditure from ingested wellness

- **GIVEN** a day with a `DailyWellness` record carrying `activeCalories` and `restingCalories`
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `restingCalories + activeCalories`
- **AND** the value is labelled `measured`

#### Scenario: Predicted expenditure for an uncovered future day

- **GIVEN** a future day with no ingested wellness record
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `BMR × activityFactor + expectedActivityKcal`
- **AND** the value is labelled `predicted`

#### Scenario: Moderate-activity rest day scales the basal by the NEAT factor

- **GIVEN** a profile with `activityLevel` = `moderate` and a computed `BMR` of 1750 kcal
- **WHEN** daily expenditure is resolved for a day with no scheduled workout (`expectedActivityKcal` = 0)
- **THEN** the predicted expenditure equals `1750 × 1.4` = 2450 kcal, not the raw 1750 kcal

#### Scenario: Scheduled workout kcal are not double-counted

- **GIVEN** a profile with `activityLevel` = `moderate` and a scheduled workout estimated at 500 `expectedActivityKcal`
- **WHEN** daily expenditure is resolved
- **THEN** the predicted expenditure equals `BMR × 1.4 + 500` — the workout kcal are added once on top of the NEAT-scaled basal and are NOT folded into the activity factor
