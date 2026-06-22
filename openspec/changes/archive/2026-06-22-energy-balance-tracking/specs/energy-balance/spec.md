## ADDED Requirements

### Requirement: Net energy-balance roll-up

The system SHALL compute, for a date and for week/month ranges, the net energy
balance as `expenditure − intake` against the day's target, exposing
`expenditureKcal`, `intakeKcal`, `netKcal`, `targetKcal`, and a `source` of
`measured`, `predicted`, or `mixed`. A day with no intake logged SHALL be reported as
untracked intake, never a silent zero.

#### Scenario: Day in deficit

- **GIVEN** a day with 3000 kcal expenditure and 2400 kcal logged intake
- **WHEN** the net balance is computed
- **THEN** `netKcal` is −600 (a deficit of 600 kcal)
- **AND** it is compared against the day's target

#### Scenario: Untracked intake is not zero

- **GIVEN** a day with resolvable expenditure but no intake entries
- **WHEN** the net balance is computed
- **THEN** intake is reported as untracked rather than 0 kcal

### Requirement: Weight trend versus goal line

The system SHALL present body weight as an exponential-moving-average (EMA) smoothed
trend alongside raw weigh-ins, and chart it against the goal's target line.

#### Scenario: Smoothed trend shown over noisy weigh-ins

- **GIVEN** several daily weigh-ins with day-to-day fluctuation
- **WHEN** the weight chart is rendered
- **THEN** an EMA-smoothed trend line is shown as the progress source-of-truth
- **AND** the raw points remain visible but de-emphasized

### Requirement: Correlation trend overlays

The system SHALL overlay steps, sleep, and weekly time-in-zone signals as trend lines
on the balance/weight chart. The system SHALL NOT present computed correlation
coefficients in this version.

#### Scenario: Overlaying wellness signals

- **WHEN** the user enables the correlation view
- **THEN** steps, sleep, and weekly time-in-zone trends are overlaid as lines
- **AND** no correlation coefficient or scatter plot is shown

### Requirement: Adaptive TDEE estimation

Once sufficient paired intake and weight history exists, the system SHALL
back-calculate real maintenance energy from the smoothed weight change versus net
energy over a rolling window and feed the corrected maintenance into the daily
target. The adaptive value SHALL be labelled an estimate.

#### Scenario: Maintenance corrected from observed history

- **GIVEN** a rolling window of consistent intake and weight data
- **WHEN** adaptive TDEE runs
- **THEN** maintenance is back-calculated from weight change versus net energy
- **AND** the corrected maintenance is labelled an estimate and applied to the target

#### Scenario: Insufficient history suppresses adaptation

- **GIVEN** fewer paired data points than the activation threshold
- **WHEN** adaptive TDEE is requested
- **THEN** no adaptive correction is applied
- **AND** the modeled maintenance remains in use
