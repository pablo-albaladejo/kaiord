## MODIFIED Requirements

### Requirement: One current body weight

The SPA SHALL resolve an athlete's current body weight as the latest weigh-in
on or before the day in question, however old, and SHALL fall back to
`profile.bodyWeight` only when the athlete has no weigh-in. When neither is
known the current weight SHALL be unknown, never estimated. Every consumer of
the athlete's weight (BMR, the BMR gate, the goal maintenance, the MET activity
estimate, the goal's default start weight, the Athlete page and the profile
snapshot sent to the extensions) SHALL use this one resolution. The latest
weigh-in is the most recent measurement: by day, then by `measuredAt`, then by
record id, so two weigh-ins of the same day (from different sources) resolve
the same way whatever order they are stored in.

Editing the weight on the Athlete page SHALL record a weigh-in dated today,
stamped with the real time it was entered, and SHALL NOT write
`profile.bodyWeight`; a second edit on the same day SHALL update that manual
weigh-in rather than add another. A manual weigh-in SHALL NOT reuse or
overwrite another source's weigh-in of the same day. A weigh-in entered for a
past day SHALL be stamped at noon of that day. The energy goal's `startWeightKg` SHALL
remain the goal's historic starting weight and SHALL default to the current
weight when a goal is set up.

#### Scenario: A weigh-in overrides the profile weight

- **GIVEN** a profile with `bodyWeight` 72.5 kg and a weigh-in of 71.9 kg
- **WHEN** the Athlete page or the expenditure calculators read the weight
- **THEN** they use 71.9 kg

#### Scenario: A weigh-in alone unlocks BMR

- **GIVEN** a profile with `height`, `birthDate` and `sex` but no `bodyWeight`
- **AND** a weigh-in
- **WHEN** the day's expenditure is predicted
- **THEN** it is not gated and BMR uses the weigh-in

#### Scenario: Same-day re-edit updates today's weigh-in

- **GIVEN** the athlete set their weight on the Athlete page today
- **WHEN** they edit it again the same day
- **THEN** exactly one weigh-in exists for today, holding the new value

#### Scenario: The later of two same-day weigh-ins is the current weight

- **GIVEN** two weigh-ins dated today from different sources, measured at 07:00 and at 18:30
- **WHEN** the current weight is read
- **THEN** it is the 18:30 weigh-in, whichever row was stored first

#### Scenario: A manual weigh-in leaves another source's row untouched

- **GIVEN** a `train2go-bridge` weigh-in dated today
- **WHEN** the athlete enters their weight by hand today
- **THEN** a separate manual weigh-in is recorded and the Train2Go weigh-in is unchanged
