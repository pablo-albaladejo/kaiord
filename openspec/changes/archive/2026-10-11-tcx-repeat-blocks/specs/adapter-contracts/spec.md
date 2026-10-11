## ADDED Requirements

### Requirement: TCX adapter reads and writes repetition blocks

The `@kaiord/tcx` reader SHALL map a TCX `Repeat_t` step to a KRD repetition block whose `repeatCount` is the `Repetitions` value and whose steps are the converted `Child` steps, in order. A `Repeat_t` nested inside another SHALL be unrolled into its parent block (its children emitted `Repetitions` times), except that a nested repeat whose copies would take its parent block past 1000 steps SHALL be imported once; a `Repeat_t` without a valid `Repetitions` SHALL be imported with `repeatCount` 1; a `Repeat_t` with no convertible child SHALL be dropped. Each of those cases SHALL emit a `Lossy conversion:` warning. The writer SHALL emit each KRD repetition block as a `Repeat_t`, so a TCX → KRD → TCX → KRD round trip yields identical workout steps.

#### Scenario: Repeat block fixture

- **GIVEN** `test-fixtures/tcx/WorkoutRepeatBlocks.tcx` (warm-up, a `Repeat_t` of 5 with a 240 s zone-4 step and a 120 s zone-2 step, cool-down)
- **WHEN** the TCX reader is invoked
- **THEN** the workout has three entries, the second a repetition block with `repeatCount` 5 and those two steps, and no warning is logged

#### Scenario: Round trip keeps the block

- **WHEN** that KRD is written to TCX and read back
- **THEN** the written TCX contains a `Repeat_t` with `<Repetitions>5</Repetitions>` and two `Child` steps
- **AND** the steps read back equal the original steps

#### Scenario: Nested repeat

- **GIVEN** a `Repeat_t` of 3 whose children are step A and a `Repeat_t` of 2 over steps B and C
- **WHEN** the TCX reader converts it
- **THEN** it returns one block with `repeatCount` 3 and steps A, B, C, B, C, and logs a `Lossy conversion:` warning naming the nested repeat
