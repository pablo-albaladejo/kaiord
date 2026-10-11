## ADDED Requirements

### Requirement: Round-trip comparison covers structured workout steps

`compareKRDs` in `@kaiord/core`, and `validateRoundTrip` through it, SHALL compare the structured workout steps of two KRDs in addition to sessions, laps and records. The step count of every step list SHALL match exactly, each node SHALL keep its kind (step or repeat block), and each repeat block SHALL keep its `repeatCount` and its nested steps. Each step SHALL keep its duration type, target type, target unit and intensity. Duration and target values SHALL stay within the round-trip tolerances: time ±1 s, distance ±1 m, power ±1 W, %FTP ±1, heart rate ±1 bpm, cadence ±1 rpm; zones, swim strokes, calories, repeat counts and `repeatFrom` SHALL match exactly. A categorical mismatch SHALL be reported as a violation with `tolerance` 0 and the two values in `expectedValue` and `actualValue`. The comparison SHALL NOT be loosened to make an adapter pass; a lossy adapter is fixed or its gap is reported.

#### Scenario: A dropped step fails the round-trip

- **GIVEN** a workout KRD with two steps and a converted KRD with one
- **WHEN** `compareKRDs` compares them
- **THEN** it reports `structured_workout.steps.length` with expected 2, actual 1 and tolerance 0

#### Scenario: A duration that changed type is reported by value

- **GIVEN** a step whose duration is `time` 300 s and the same step converted to an `open` duration
- **WHEN** `compareKRDs` compares them
- **THEN** it reports `structured_workout.steps[0].duration.type` with `expectedValue` `time` and `actualValue` `open`

#### Scenario: A drift within tolerance passes

- **GIVEN** a step of 300 s and the same step converted to 301 s
- **WHEN** `compareKRDs` compares them
- **THEN** it reports no violation
