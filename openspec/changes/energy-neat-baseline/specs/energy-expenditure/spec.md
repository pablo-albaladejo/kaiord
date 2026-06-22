## MODIFIED Requirements

### Requirement: Daily expenditure resolution

The system SHALL resolve a day's total energy expenditure as measured
(`restingCalories + activeCalories`) when a connection covers that day, and as
predicted (`BMR · neatFactor + expectedActivityKcal`) otherwise, where
`neatFactor` is a non-exercise daily-activity multiplier derived from the
profile's `activityLevel` and defaults to 1 (BMR alone) when `activityLevel` is
unset. Scheduled-workout kcal SHALL be added via `expectedActivityKcal` only, so
they are never double-counted into the basal. Each resolved value SHALL be
labelled `measured`, `predicted`, or `mixed`.

#### Scenario: Measured expenditure from ingested wellness

- **GIVEN** a day with a `DailyWellness` record carrying `activeCalories` and `restingCalories`
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `restingCalories + activeCalories`
- **AND** the value is labelled `measured`

#### Scenario: Predicted expenditure for an uncovered future day

- **GIVEN** a future day with no ingested wellness record
- **WHEN** daily expenditure is resolved
- **THEN** expenditure equals `BMR · neatFactor + expectedActivityKcal`
- **AND** the value is labelled `predicted`

#### Scenario: Rest-day baseline reflects non-exercise activity

- **GIVEN** a profile with `activityLevel: moderate` and no scheduled workout
- **WHEN** daily expenditure is resolved
- **THEN** the basal equals `BMR · neatFactor` and exceeds raw BMR
- **AND** scheduled-workout kcal are not double-counted into the basal

#### Scenario: Basal falls back to raw BMR when activity level is unset

- **GIVEN** a profile with the physiological fields but no `activityLevel`
- **WHEN** daily expenditure is resolved
- **THEN** the basal equals raw `BMR` (`neatFactor` of 1)
