## MODIFIED Requirements

### Requirement: `bodyWeight` and `heartRate.max` are populated from the `/user/details` physiological block, not the ping payload

When zones-sync runs (toggle is on, link/sync trigger fired), the use case SHALL extract the weight and `heartRate.max` from the `physiological` block of the parsed `/user/details` response. The `/profile/ping` payload's `data.user.weight` and `data.user.bpm_max` are NOT consulted by zones-sync — they remain an independent source used by the heartbeat / Profile Manager status display only. The parsed `physiological.bpmRest` field is now allowlisted by the bridge parser and flows through the SPA `ZonesPayload` Zod type, but it is NOT persisted to the profile by `syncZones` in this change — Kaiord has no consumer field for resting HR yet, and the data is allowlisted to enable a future Karvonen-derivation path without a second privacy-surface review.

#### Scenario: /user/details physiological block populates the weight and heartRate.max

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **AND** the athlete has no current weight and the profile has no `heartRate.max`
- **WHEN** zones-sync runs
- **THEN** today's weigh-in SHALL be 83 kg and the persisted profile SHALL be updated with `heartRate.max: 187`

#### Scenario: zones-sync ignores the ping payload's weight and bpm_max

- **GIVEN** the most recent `/profile/ping` payload had `data.user.weight = 90` and `data.user.bpm_max = 200`
- **AND** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **WHEN** zones-sync runs
- **THEN** today's weigh-in SHALL be 83 kg and the persisted profile SHALL be updated with `heartRate.max: 187` (from `/user/details`)
- **AND** the ping payload values SHALL NOT be consulted by zones-sync

#### Scenario: bpmRest flows through the payload but is not persisted

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187, bpmRest: 51 }`
- **WHEN** `syncZones` runs against an empty profile
- **THEN** today's weigh-in and the persisted profile's `heartRate.max` SHALL be updated as before
- **AND** the profile SHALL NOT gain a `restingHeartRate` field as a result of this sync (Kaiord has no consumer in v1)
