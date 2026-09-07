## ADDED Requirements

### Requirement: One threshold unit across every suite

Every eval suite SHALL express its pass floor as a fraction in the closed
interval `0..1`. A threshold stated as a percentage SHALL be rejected, so that
the floors of different suites are comparable without conversion.

#### Scenario: The three suites compare on one scale

- **GIVEN** the workout-parsing, chat-tool and lab-extraction suites
- **WHEN** their floors are read side by side
- **THEN** all three SHALL be fractions in `0..1`, and the numerically smaller floor SHALL be the looser gate

#### Scenario: A percentage floor is refused

- **WHEN** a criterion declares a `hardRequirement` of `90` alongside an `ideal` expressed as a fraction
- **THEN** the declaration SHALL be rejected rather than silently compared against a ratio

### Requirement: Every threshold names its benchmark and its owner

A criterion SHALL declare where its number comes from and who set it. A
criterion whose benchmark cannot be named SHALL NOT compile, and prose SHALL
NOT satisfy the field.

#### Scenario: A floor without a source is not shippable

- **WHEN** a criterion declares a `hardRequirement` with no benchmark identifying the suite, dataset or measurement it derives from
- **THEN** the declaration SHALL fail to compile

#### Scenario: An existing floor is documented

- **GIVEN** the lab-extraction floor, which is defended nowhere today
- **WHEN** it is declared as a criterion
- **THEN** it SHALL carry the benchmark it was measured against and the owner who set it

### Requirement: Gating authority follows the scorer tier

The right to block a release SHALL be bound to how reproducible the scorer is.
A T1 deterministic scorer MAY gate. A T2 small-classifier scorer MAY gate only
with a pinned model version. A T3 LLM-judge scorer SHALL NOT gate; it alerts
and queues a review.

#### Scenario: A judge cannot block a build

- **GIVEN** a criterion scored by an LLM judge
- **WHEN** it declares a `hardRequirement`
- **THEN** the floor SHALL raise an alert rather than fail the build, because changing the judge's prompt changes the metric

#### Scenario: A classifier gates only when pinned

- **GIVEN** a criterion scored by a small specialized classifier
- **WHEN** it declares a `hardRequirement` without a pinned model version
- **THEN** the declaration SHALL be rejected

### Requirement: Cost and latency are criteria, not decoration

Each suite SHALL report a P90 latency over its cases and the total token usage
of the run, and both SHALL be declarable as criteria with floors. Latency and
usage SHALL be reported whether or not a floor is set.

#### Scenario: Latency is aggregated, not only printed

- **GIVEN** `durationMs` recorded on every eval result
- **WHEN** a suite finishes
- **THEN** the report SHALL carry a P90 over the suite's cases

#### Scenario: A run states what it cost

- **WHEN** a suite that calls a real model finishes
- **THEN** the report SHALL carry the total token usage for the run

### Requirement: Absence of measurement is a distinct result

An eval result SHALL distinguish "measured and failed" from "never measured".
The unmeasured state SHALL be a member of the result union carrying a stated
reason and no score, so it cannot be averaged, summed or compared as though it
were a score.

#### Scenario: An unmeasured criterion cannot inflate a pass rate

- **GIVEN** a criterion that produced no measurement
- **WHEN** the suite computes its pass rate
- **THEN** the unmeasured criterion SHALL be excluded from the rate and reported separately with its reason

#### Scenario: Counts are reported as a pair

- **WHEN** a suite reports its results
- **THEN** it SHALL report how many criteria were measured alongside how many passed

### Requirement: A scorer refuses input it does not understand

A scorer SHALL treat malformed input as a harness fault and fail, naming the
value it received and the shape it expected. Absent expectations SHALL remain a
clean pass; a malformed expectation SHALL NOT be read as an absent one.

#### Scenario: A reshaped input fails loudly

- **GIVEN** a scorer whose expectations arrive as a scalar where a list is required
- **WHEN** the scorer runs
- **THEN** it SHALL fail as a harness fault rather than take its "no expectations" branch and pass

#### Scenario: Genuinely absent expectations still pass

- **GIVEN** a case that declares no expectations for a scorer
- **WHEN** the scorer runs
- **THEN** it SHALL pass cleanly

### Requirement: The chat-tool suite covers both tool families

The chat-tool suite SHALL cover every read tool and every action tool exposed
to the model, asserting the tool called and, for action tools, the paused
pending action and its input fields. While the suite is too small for a
fractional floor to discriminate, its gate SHALL require all cases to pass.

#### Scenario: Every exposed tool is represented

- **WHEN** the chat-tool suite runs
- **THEN** it SHALL contain at least one case per tool exposed to the model

#### Scenario: A small suite gates on all-pass

- **GIVEN** a suite small enough that one failure crosses any fractional floor
- **WHEN** its gate is declared
- **THEN** the gate SHALL be all-pass rather than a fraction that only appears to be a threshold
