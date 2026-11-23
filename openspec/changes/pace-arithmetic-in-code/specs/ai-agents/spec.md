## ADDED Requirements

### Requirement: The workout parser computes every number from the coach's literals

The workout parser SHALL take from the model only what the coach wrote, in
the coach's units: time and distance parts, a pace clock per a named distance
(and a second clock for a range), a split time over the step's own distance,
a km/h or mph speed, a named pace reference, a % max heart-rate range as its
two ends, and a block's total time. Code SHALL compute every number the
Workout carries from those literals: seconds, metres, m/s rounded to 0.001,
the heart-rate midpoint, the zone a reference names, and the whole cycles a
block's total fits. A pace in m/s from the model SHALL be refused before any
resolution, and a literal code cannot read SHALL be refused with a message the
retry loop returns to the model.

#### Scenario: A pace per kilometre becomes m/s in code

- **WHEN** the model returns a 20-minute step with `{ "unit": "pace", "per": "km", "clock": "4:30" }`
- **THEN** the Workout step SHALL carry `seconds: 1200` and a pace of `3.704` m/s

#### Scenario: A split is computed over the step's distance

- **WHEN** the model returns an 800 m step with `{ "unit": "split", "clock": "3:10" }`
- **THEN** the step's pace SHALL be `4.211` m/s, and the same split on a timed step SHALL be refused

#### Scenario: A reference takes the athlete's zone range

- **GIVEN** an athlete whose pace zones 4 and 5 span 3.448–4.255 m/s
- **WHEN** the model returns a step at `{ "unit": "reference", "reference": "10k" }`
- **THEN** the step SHALL carry the pace range 3.448–4.255 m/s

#### Scenario: A filled block never passes the coach's total

- **WHEN** the model returns a block with `fill` of 30 minutes over a 1-minute and a 2-minute step
- **THEN** the block SHALL repeat 10 times

#### Scenario: A computed speed is refused

- **WHEN** the model returns a pace target with `unit: "mps"`
- **THEN** validation SHALL fail naming the literal forms to use, and no Workout SHALL carry that number
