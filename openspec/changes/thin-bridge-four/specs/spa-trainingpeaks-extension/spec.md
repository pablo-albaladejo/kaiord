## ADDED Requirements

### Requirement: The TrainingPeaks Connector reads TrainingPeaks' answers

The TrainingPeaks Connector in the Kaiord App SHALL build each path from the athlete id `read-athlete-id` answers (or the one a send was built against), space consecutive metric reads by 150 ms, word a 402 on a workout write as a planning-horizon refusal keeping its status, and keep of one workout read only that it is present, absent (404) or unknown.

#### Scenario: A 402 is the planning horizon

- **GIVEN** TrainingPeaks answers a workout write with 402
- **WHEN** the Connector reads the failure
- **THEN** the error says a paid account is needed for that date and keeps status 402
