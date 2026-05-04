## ADDED Requirements

### Requirement: `ZonesPayload` carries full Z1-Z5 bands per block

The `ZonesPayload` Zod type emitted by the bridge and consumed by `syncZones` SHALL include, for each present block, the full Z1-Z5 bands shaped as `{ lower, upper }` (HR + cycling power) or `{ lower: { min, sec }, upper: { min, sec } }` (running + swimming pace). The threshold-scalar convenience fields (`z4Upper`, `z5Lower`) SHALL coexist with the band fields so existing FieldKey-level writes for `cycling.thresholds.ftp`, `cycling.thresholds.lthr`, `running.thresholds.lthr`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `bodyWeight`, and `heartRate.max` keep working byte-identically.

#### Scenario: Backwards compat — z4Upper consumers still work

- **GIVEN** a payload with the new full-band shape: `payload.hrZones.cycling.z4 = { lower: 161, upper: 174 }`
- **AND** the convenience field `payload.hrZones.cycling.z4Upper = 174` (parser-derived from `z4.upper`)
- **WHEN** the SPA mapper computes the cycling LTHR threshold
- **THEN** `incoming.cycling.thresholds.lthr` SHALL equal `174` (existing FieldKey write path is unchanged)

#### Scenario: Older-bridge backwards compat — payload with z4Upper only (no z1..z5 bands)

- **GIVEN** a payload from an older bridge that has not yet rolled out the full-band parser (PR 1 not yet installed in the user's browser): `payload.hrZones.cycling = { z4Upper: 174 }` — no `z1..z5` keys present
- **AND** the user has the new SPA build (PR 2 already deployed, ahead of the bridge update)
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the threshold scalar `cycling.thresholds.lthr` SHALL be silently filled with `174` (the threshold-scalar write path is unchanged)
- **AND** `sportZones.cycling.heartRateZones.zones` SHALL NOT be touched (the band-level write path is skipped because `payload.hrZones.cycling.z1..z5` is absent)
- **AND** no error or warning SHALL surface to the user — the SPA tolerates the older-bridge payload shape gracefully (PR 2 is forward-compatible with the shipped bridge build per the migration plan in design.md)

### Requirement: HR fallback chain — Specific over Generic, Generic over skip

For each sport `s ∈ { cycling, running, swimming }`, the SPA-side `syncZones` use case SHALL select the HR-band source for that sport in this order:

1. `payload.hrZones.<s>` (Specific block) — used when present.
2. `payload.hrZones.generic` (Generic Karvonen-derived block) — used as fallback when the Specific block is absent.
3. _skip_ — neither block present; the sport's `heartRateZones.zones` SHALL NOT be touched by `syncZones`.

#### Scenario: Triathlete with cycling-specific only — running and swimming fall back to Generic

- **GIVEN** the parsed payload has `payload.hrZones.cycling` (Specific) AND `payload.hrZones.generic` (Generic)
- **AND** `payload.hrZones.running` and `payload.hrZones.swimming` are both absent
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the cycling profile zones SHALL be written from `payload.hrZones.cycling`
- **AND** the running profile zones SHALL be written from `payload.hrZones.generic`
- **AND** the swimming profile zones SHALL be written from `payload.hrZones.generic`

#### Scenario: Generic absent, no Specific — sport's HR zones are not touched

- **GIVEN** `payload.hrZones.generic` is absent (the upstream user has no maxHR or bpm_rest configured)
- **AND** no `payload.hrZones.<sport>` Specific block is present either
- **WHEN** `syncZones` runs
- **THEN** the profile's `sportZones.<sport>.heartRateZones.zones` SHALL remain at whatever value it held before the sync
- **AND** no conflict row SHALL be emitted for that sport's HR bands

#### Scenario: All sports have Specific blocks — Generic is unused

- **GIVEN** the parsed payload has all four HR blocks present: `payload.hrZones.cycling` (Specific), `payload.hrZones.running` (Specific), `payload.hrZones.swimming` (Specific), AND `payload.hrZones.generic` (Karvonen-derived)
- **AND** the user's profile has `sportZones.{cycling,running,swimming}.heartRateZones.zones = []` (all empty)
- **WHEN** `syncZones` runs
- **THEN** the cycling profile zones SHALL be written from `payload.hrZones.cycling` (Specific wins per fallback rule 1)
- **AND** the running profile zones SHALL be written from `payload.hrZones.running`
- **AND** the swimming profile zones SHALL be written from `payload.hrZones.swimming`
- **AND** `payload.hrZones.generic` SHALL NOT be consulted for any sport (Specific wins for all three; Generic is only the fallback when Specific is absent)

## MODIFIED Requirements

### Requirement: `bodyWeight` and `heartRate.max` are populated from the `/user/details` physiological block, not the ping payload

When zones-sync runs (toggle is on, link/sync trigger fired), the use case SHALL extract `bodyWeight` and `heartRate.max` from the `physiological` block of the parsed `/user/details` response. The `/profile/ping` payload's `data.user.weight` and `data.user.bpm_max` are NOT consulted by zones-sync — they remain an independent source used by the heartbeat / Profile Manager status display only. The parsed `physiological.bpmRest` field is now allowlisted by the bridge parser and flows through the SPA `ZonesPayload` Zod type, but it is NOT persisted to the profile by `syncZones` in this change — Kaiord has no consumer field for resting HR yet, and the data is allowlisted to enable a future Karvonen-derivation path without a second privacy-surface review.

#### Scenario: /user/details physiological block populates bodyWeight and heartRate.max

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **AND** the user's profile has both fields empty
- **WHEN** zones-sync runs
- **THEN** the persisted profile SHALL be updated with `bodyWeight: 83` and `heartRate.max: 187`

#### Scenario: zones-sync ignores the ping payload's weight and bpm_max

- **GIVEN** the most recent `/profile/ping` payload had `data.user.weight = 90` and `data.user.bpm_max = 200`
- **AND** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187 }`
- **WHEN** zones-sync runs
- **THEN** the persisted profile SHALL be updated with `bodyWeight: 83` and `heartRate.max: 187` (from `/user/details`)
- **AND** the ping payload values SHALL NOT be consulted by zones-sync

#### Scenario: bpmRest flows through the payload but is not persisted

- **GIVEN** the parsed `/user/details` HTML returns `physiological: { weight: 83, bpmMax: 187, bpmRest: 51 }`
- **WHEN** `syncZones` runs against an empty profile
- **THEN** the persisted profile's `bodyWeight`, `maxHeartRate` SHALL be updated as before
- **AND** the profile SHALL NOT gain a `restingHeartRate` field as a result of this sync (Kaiord has no consumer in v1)
