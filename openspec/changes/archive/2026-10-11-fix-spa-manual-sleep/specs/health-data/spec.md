## MODIFIED Requirements

### Requirement: Sleep Record Sub-Schema

`extensions.health.sleep` SHALL conform to a Zod schema with the discriminator `kind: z.literal("sleep")` and the following fields:

- `version: z.string().regex(/^2\.\d+$/)` — additive evolution marker within the v2.x line; the producer SHALL emit `"2.0"` initially; future v2.x producers MAY emit `"2.1"`, `"2.2"`, etc. without bumping the canonical KRD `version`
- `startTime: z.string()` — ISO datetime of sleep onset
- `endTime: z.string()` — ISO datetime of wake
- `totalDurationSeconds: z.number().int().nonnegative().optional()` — total in-bed duration; absent when the duration was not recorded (e.g. only a hand-entered score). A producer SHALL NOT write `0` to mean "not recorded"
- `stages: z.array(SleepStage)` — non-overlapping time-ordered stages where each `SleepStage` is `{ stage: "awake" | "light" | "deep" | "rem", startTime: string, durationSeconds: number }`; an empty array means the stages were not recorded
- `score: z.number().int().min(0).max(100).optional()` — sleep score
- `restingHeartRate: z.number().int().positive().optional()` — bpm

When `stages` is non-empty, the schema SHALL require `totalDurationSeconds` and SHALL include a `superRefine` that the sum of `stages[*].durationSeconds` is within ±60 seconds of it. When `stages` is empty, no stage-sum check applies.

#### Scenario: Stages summing to total duration validates

- **GIVEN** a sleep record with `totalDurationSeconds: 28800` and four stages summing to 28820 seconds
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation succeeds (within the ±60 s tolerance)

#### Scenario: Stages diverging from total duration rejected

- **GIVEN** a sleep record with `totalDurationSeconds: 28800` and stages summing to 30000 seconds
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation fails with a Zod error citing the stage-total mismatch

#### Scenario: Missing required field rejected

- **GIVEN** a sleep record payload without `startTime`
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation fails with a Zod error naming the missing field

#### Scenario: A duration without recorded stages validates

- **GIVEN** a sleep record with `totalDurationSeconds: 27000` and `stages: []`
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation succeeds

#### Scenario: A score without a recorded duration validates

- **GIVEN** a sleep record with `score: 81`, `stages: []` and no `totalDurationSeconds`
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation succeeds

#### Scenario: Stages without a total duration rejected

- **GIVEN** a sleep record with four stages and no `totalDurationSeconds`
- **WHEN** parsed via the sleep sub-schema
- **THEN** validation fails
