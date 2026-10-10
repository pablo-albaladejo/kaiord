## ADDED Requirements

### Requirement: FIT writer round-trips structured workouts through the SDK encoder

The `@kaiord/fit` writer SHALL produce workout step messages whose durations, targets and repeat conditions survive the `@garmin/fitsdk` `Encoder` and `Decoder`. Because the Encoder writes only main profile fields, the writer SHALL fill `durationValue`, `targetValue` and the custom target fields' main field from the sub-field active for the step's `durationType`/`targetType`, and SHALL write every message's fields in profile field-number order so that a reused definition keeps each value in its slot. Repeat-until steps SHALL use the profile's `repeat*` sub-fields for their condition value and `durationStep` for the step they repeat from. Reading a FIT workout, writing it back and reading it again SHALL yield the same KRD steps, and a round-trip test SHALL cover every workout fixture in `test-fixtures/fit/` and every KRD duration and target the writer supports.

#### Scenario: Repeat block survives a re-import

- **GIVEN** `test-fixtures/fit/WorkoutRepeatSteps.fit`, whose steps include a block repeated three times
- **WHEN** it is read to KRD, written back to FIT and read again
- **THEN** the second KRD has the same steps as the first, including the repeat block with `repeatCount` 3 and its two steps

#### Scenario: Distances and zone targets survive a re-import

- **GIVEN** `test-fixtures/fit/WorkoutIndividualSteps.fit`
- **WHEN** it is read to KRD, written back to FIT and read again
- **THEN** step 1 keeps its `distance` duration of 500 m and its power zone 5 target

#### Scenario: Repeat-until condition survives a write

- **GIVEN** a KRD step with duration `repeat_until_time`, 600 seconds, `repeatFrom` 0
- **WHEN** it is written to FIT and read back
- **THEN** the step has the same duration type, seconds and `repeatFrom`
