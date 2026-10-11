## ADDED Requirements

### Requirement: FIT workout heart-rate and power values use the profile offsets

The `@kaiord/fit` adapter SHALL encode and decode every workout step field of FIT type `workoutHr` or `workoutPower` with the profile's offsets: an absolute heart rate is stored as bpm + 100 and an absolute power as watts + 1000. This covers the custom heart-rate and power target ranges, the `hrLessThan`, `powerLessThan` and `powerGreaterThan` duration conditions, and the `repeatHr` and `repeatPower` repeat conditions. KRD ranges and conditions are absolute, so the writer SHALL add the offset and the reader SHALL remove it from a value above the offset. Because a repeat-until step carries its repeat condition in `targetValue`, the reader SHALL give such a step an open target.

#### Scenario: Garmin heart-rate condition reads as bpm

- **GIVEN** `test-fixtures/fit/WorkoutCustomTargetValues.fit`, whose step 3 has `durationType` `hrLessThan` and raw `durationHr` 225
- **WHEN** it is read to KRD
- **THEN** step 3 has duration `heart_rate_less_than` with `bpm` 125

#### Scenario: Absolute power range is written with the watts offset

- **GIVEN** a KRD step with a power target range of 200-250 W
- **WHEN** it is written to FIT and decoded by the SDK decoder
- **THEN** the step's `customTargetPowerLow` is 1200 and `customTargetPowerHigh` is 1250

#### Scenario: Repeat-until heart-rate value is not read as a target

- **GIVEN** `test-fixtures/fit/WorkoutRepeatGreaterThanStep.fit`, whose step 3 is `repeatUntilHrGreaterThan` with `targetValue` 80
- **WHEN** it is read to KRD
- **THEN** step 3 has an open target
