## ADDED Requirements

### Requirement: Energy-balance assistant tool

The chat assistant SHALL expose a `query-energy-balance` tool, registered in the
existing chat tool registry, that returns per-day energy balance
(`expenditureKcal`, `intakeKcal`, `netKcal`, `targetKcal`, macro targets/actuals,
`source`) plus active-goal context for a requested date range, so the assistant can
answer deficit/surplus, remaining-kcal, and macro-target questions from real data.

#### Scenario: Assistant answers "am I in deficit today?"

- **GIVEN** a profile with a goal and resolvable expenditure and intake for today
- **WHEN** the user asks the assistant whether they are in a deficit today
- **THEN** the assistant calls `query-energy-balance` for today
- **AND** answers with the net balance versus the target from the returned data

#### Scenario: Assistant answers remaining kcal

- **GIVEN** a day with a target of 2500 kcal and 1800 kcal logged intake
- **WHEN** the user asks how many kcal they can still eat
- **THEN** the assistant uses the tool result to answer 700 kcal remaining
