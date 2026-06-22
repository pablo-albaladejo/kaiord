## ADDED Requirements

### Requirement: Net-balance badge on the calendar

The calendar WellnessBand SHALL display a per-day net energy-balance badge when the
day's balance is resolvable, indicating deficit or surplus, and SHALL omit the badge
when expenditure cannot be resolved.

#### Scenario: Badge shown for a resolvable day

- **GIVEN** a calendar day with resolvable expenditure and logged intake
- **WHEN** the WellnessBand renders
- **THEN** a net-balance badge shows the day's deficit or surplus

#### Scenario: Badge omitted when balance is unresolvable

- **GIVEN** a calendar day with no resolvable expenditure
- **WHEN** the WellnessBand renders
- **THEN** no net-balance badge is shown for that day
