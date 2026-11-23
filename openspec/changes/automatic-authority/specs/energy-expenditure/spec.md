## ADDED Requirements

### Requirement: One current body weight, read by the Authority

The SPA SHALL resolve an athlete's current body weight as the weigh-in of the
most recent day on or before the day in question that has one, however old,
and SHALL fall back to `profile.bodyWeight` only when the athlete has no
weigh-in. When neither is known the current weight SHALL be unknown, never
estimated. A day two sources weighed SHALL read as the Day reads it, by the
Authority in force for weight (`spa-authority`, "Kaiord picks the Authority by
itself": the athlete's own entry, then Tanita, TrainingPeaks, Train2Go, or the
athlete's matrix choice while it applies), never by which row was recorded
later; among one source's weigh-ins of that day the most recent measurement
wins (by `measuredAt`, then by record id), so the result is the same whatever
order the rows are stored in. Every consumer of the athlete's weight (BMR, the
BMR gate, the goal maintenance, the MET activity estimate, the goal's default
start weight, the Athlete page and the profile snapshot sent to the
extensions) SHALL use this one resolution.

Editing the weight on the Athlete page SHALL record a weigh-in dated today,
stamped with the real time it was entered, and SHALL NOT write
`profile.bodyWeight`; a second edit on the same day SHALL update that manual
weigh-in rather than add another. A manual weigh-in SHALL NOT reuse or
overwrite another source's weigh-in of the same day. A weigh-in entered for a
past day SHALL be stamped at noon of that day. The energy goal's
`startWeightKg` SHALL remain the goal's historic starting weight and SHALL
default to the current weight when a goal is set up.

#### Scenario: A weigh-in is the current weight over the profile weight

- **GIVEN** a profile with `bodyWeight` 72.5 kg and a weigh-in of 71.9 kg
- **WHEN** the Athlete page or the expenditure calculators read the weight
- **THEN** they use 71.9 kg

#### Scenario: A lone weigh-in unlocks BMR

- **GIVEN** a profile with `height`, `birthDate` and `sex` but no `bodyWeight`
- **AND** a weigh-in
- **WHEN** the day's expenditure is predicted
- **THEN** it is not gated and BMR uses the weigh-in

#### Scenario: A same-day re-edit updates today's weigh-in

- **GIVEN** the athlete set their weight on the Athlete page today
- **WHEN** they edit it again the same day
- **THEN** exactly one weigh-in exists for today, holding the new value

#### Scenario: The later of one source's two weigh-ins of a day is read

- **GIVEN** two weigh-ins dated today from the same source, measured at 07:00 and at 18:30
- **WHEN** the current weight is read
- **THEN** it is the 18:30 weigh-in, whichever row was stored first

#### Scenario: Two sources of the same day are read by the Authority

- **GIVEN** the athlete's own weigh-in at 07:00 and a `train2go-bridge` weigh-in recorded at 09:00, both dated today
- **WHEN** the current weight is read, for the Athlete page or for the day's energy
- **THEN** it is the athlete's own weigh-in
- **AND** with a Tanita weigh-in in place of the athlete's, it is Tanita's

#### Scenario: The most recent day decides even when only a Platform weighed it

- **GIVEN** a Tanita weigh-in yesterday and a `train2go-bridge` weigh-in today
- **WHEN** the current weight is read
- **THEN** it is today's Train2Go weigh-in

#### Scenario: A manual weigh-in leaves another source's row untouched

- **GIVEN** a `train2go-bridge` weigh-in dated today
- **WHEN** the athlete enters their weight by hand today
- **THEN** a separate manual weigh-in is recorded and the Train2Go weigh-in is unchanged

## REMOVED Requirements

### Requirement: One current body weight

**Reason**: Two weigh-ins of the same day from different sources resolved to the one recorded later, so a Train2Go weigh-in stored after the athlete's own entry or this morning's scale reading became the current weight, and the Athlete page and energy read a different weight from the Day (#1666).

**Migration**: "One current body weight, read by the Authority": the same resolution, with a day two sources weighed read by the Authority in force.
