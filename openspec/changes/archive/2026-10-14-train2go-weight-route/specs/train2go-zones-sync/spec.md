## MODIFIED Requirements

### Requirement: Train2Go's weight is the athlete's current weight

The zones sync SHALL treat Train2Go's `physiological.weight` as the athlete's current weight, never as `profile.bodyWeight`. It SHALL compare the incoming weight against the current weight (the latest weigh-in on or before today, else `profile.bodyWeight`, through `getCurrentWeightKg`) under the same fill / no-op / conflict rules as every other field. A silent fill, and an accepted weight conflict, SHALL record the weight as a weigh-in for today stamped `sourceBridgeId: "train2go-bridge"` (the Train2Go bridge id, like every other bridge's health rows), never as `"manual"`. Sources SHALL NOT overwrite each other's rows: a same-day write SHALL update only Train2Go's own weigh-in of that day, and a manual weigh-in of the same day SHALL stay untouched, The Train2Go weigh-in SHALL carry `measuredAt` = the moment it is recorded, so the current weight is the most recent measurement: of two weigh-ins on the same day, the one measured later SHALL win, whatever order the rows are stored in. The weigh-in SHALL be governed by the `weight · import · train2go-bridge` integration policy, like every other source's weight: with that route switched off the sync SHALL neither record the weight nor raise a weight conflict, and committing an accepted weight conflict SHALL record nothing. When no such route exists — an extension that does not announce `read:body`, or a link made before it did — the weight SHALL be recorded as if the route were on, so an athlete who has not updated the extension sees no change. Under a priority source policy the Train2Go weigh-in SHALL be ranked by its route like any other source. Neither `syncZones` nor `commitConflictResolution` SHALL write `profile.bodyWeight`. A weight equal to Train2Go's own latest weigh-in, or to the current weight, SHALL record nothing and raise no conflict.

#### Scenario: An unknown weight is recorded as today's weigh-in

- **GIVEN** the athlete has no weigh-in and no `profile.bodyWeight`
- **AND** Train2Go reports `physiological.weight = 83`
- **WHEN** `syncZones` runs
- **THEN** `applied` SHALL contain `{ field: "bodyWeight", value: 83 }`
- **AND** one weigh-in of 83 kg dated today, stamped `train2go-bridge`, SHALL exist
- **AND** `profile.bodyWeight` SHALL stay unset

#### Scenario: Re-syncing the same weight records no second weigh-in

- **GIVEN** a previous sync recorded today's weigh-in of 83 kg
- **WHEN** `syncZones` runs again and Train2Go still reports 83
- **THEN** `applied` and `conflicts` SHALL be empty
- **AND** exactly one weigh-in SHALL exist

#### Scenario: The comparison reads the latest weigh-in, not the profile field

- **GIVEN** `profile.bodyWeight = 80` and the latest weigh-in is 83 kg
- **WHEN** `syncZones` runs and Train2Go reports 83
- **THEN** no conflict SHALL be returned for `bodyWeight`

#### Scenario: An accepted weight conflict keeps today's manual weigh-in

- **GIVEN** today's manual weigh-in is 75 kg and Train2Go reports 83
- **WHEN** `commitConflictResolution` is called twice with `{ "bodyWeight": "accept" }`
- **THEN** the manual weigh-in of 75 kg SHALL be unchanged
- **AND** exactly one `train2go-bridge` weigh-in dated today SHALL exist, at 83 kg
- **AND** `profile.bodyWeight` SHALL be unchanged

#### Scenario: An accepted weight becomes the current weight over an earlier manual weigh-in

- **GIVEN** today's manual weigh-in of 75 kg was measured at 07:00 and Train2Go reports 83
- **WHEN** the weight conflict is accepted at 09:00
- **THEN** the current weight SHALL be 83 kg, whichever order the two rows are stored in

#### Scenario: A later manual edit wins over the Train2Go weigh-in

- **GIVEN** Train2Go's weigh-in of 83 kg was recorded today at 09:00
- **WHEN** the athlete enters 75 kg by hand at 10:00
- **THEN** the current weight SHALL be 75 kg and the Train2Go weigh-in SHALL be unchanged

#### Scenario: A weight Train2Go already reported raises no conflict again

- **GIVEN** today has a manual weigh-in of 75 kg and a `train2go-bridge` weigh-in of 83 kg
- **WHEN** `syncZones` runs and Train2Go still reports 83
- **THEN** `applied` and `conflicts` SHALL be empty and no weigh-in SHALL be added

#### Scenario: A weight route switched off withholds the weight

- **GIVEN** the athlete's `weight · import · train2go-bridge` route exists and is disabled
- **AND** the current weight is 80 kg and Train2Go reports 83
- **WHEN** `syncZones` runs
- **THEN** `applied` and `conflicts` SHALL contain no `bodyWeight` entry
- **AND** no `train2go-bridge` weigh-in SHALL be recorded
- **AND** a later `commitConflictResolution` with `{ "bodyWeight": "accept" }` SHALL record none either

#### Scenario: A weight route switched on records the weight

- **GIVEN** the athlete's `weight · import · train2go-bridge` route exists and is enabled
- **AND** the athlete has no current weight and Train2Go reports 83
- **WHEN** `syncZones` runs
- **THEN** one `train2go-bridge` weigh-in of 83 kg dated today SHALL exist

#### Scenario: No weight route keeps the weight flowing

- **GIVEN** the athlete has no `weight · import · train2go-bridge` route, because the extension does not announce `read:body` or Train2Go was linked before it did
- **AND** the athlete has no current weight and Train2Go reports 83
- **WHEN** `syncZones` runs
- **THEN** one `train2go-bridge` weigh-in of 83 kg dated today SHALL exist
