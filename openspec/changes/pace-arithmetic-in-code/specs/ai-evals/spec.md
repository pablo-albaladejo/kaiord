## ADDED Requirements

### Requirement: Pace arithmetic is measured by the numbers code computed

The parser benchmarks SHALL include Coaching Activities with pace arithmetic in
English and in Spanish, at least four in each, that declare `expectedNumbers`.
The `numbers` dimension SHALL pass only when, for every declared check, some
step carries exactly the declared seconds, metres, m/s, pace range or % max
heart rate (to 1e-9), so a number a model computed or rounded itself fails. A
benchmark with no `expectedNumbers` SHALL report the dimension unmeasured. A
check naming no number, a non-positive number or a reversed range SHALL be
rejected by the keyless fixture invariants. A keyless test SHALL drive every
pace benchmark through the real runtime with a rule-following model output and
pass it; such outputs are test doubles and SHALL NOT be presented as recorded
cassettes.

#### Scenario: A model-rounded pace fails

- **GIVEN** the benchmark "1h15' de rodaje a 5'10\"/km", which expects 4500 s at 3.226 m/s
- **WHEN** the scored step carries 3.23 m/s
- **THEN** the `numbers` dimension SHALL fail and the case SHALL NOT pass

#### Scenario: Both languages are covered

- **WHEN** the fixture invariants run
- **THEN** they SHALL fail if fewer than four English or four Spanish benchmarks declare `expectedNumbers`
