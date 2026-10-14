## ADDED Requirements

### Requirement: Train2Go's weight is the athlete's current weight

The zones sync SHALL treat Train2Go's `physiological.weight` as the athlete's current weight, never as `profile.bodyWeight`. It SHALL compare the incoming weight against the current weight (the latest weigh-in on or before today, else `profile.bodyWeight`, through `getCurrentWeightKg`) under the same fill / no-op / conflict rules as every other field. A silent fill, and an accepted weight conflict, SHALL record the weight as a weigh-in for today stamped `sourceBridgeId: "train2go-bridge"` (the Train2Go bridge id, like every other bridge's health rows), never as `"manual"`. Sources SHALL NOT overwrite each other's rows: a same-day write SHALL update only Train2Go's own weigh-in of that day, and a manual weigh-in of the same day SHALL stay untouched, The Train2Go weigh-in SHALL carry `measuredAt` = the moment it is recorded, so the current weight is the most recent measurement: of two weigh-ins on the same day, the one measured later SHALL win, whatever order the rows are stored in. The weigh-in is gated only by the zones-sync toggle: Train2Go announces no `read:body` capability, so the Data Hub offers no `weight ← train2go-bridge` route, and under a priority source policy the Train2Go weigh-in is skipped like any source without an enabled import route. Neither `syncZones` nor `commitConflictResolution` SHALL write `profile.bodyWeight`. A weight equal to Train2Go's own latest weigh-in, or to the current weight, SHALL record nothing and raise no conflict.

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

## MODIFIED Requirements

### Requirement: `syncZones` returns conflicts unwritten, silent fills are committed eagerly

The `syncZones(profileId, transport, persistence): Promise<SyncZonesResult>` use case SHALL reconcile each Train2Go field against the persisted Kaiord profile under the following rules:

| Kaiord field state             | Action                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Empty / absent                 | Write the Train2Go value silently and include it in `applied` |
| Same value as Train2Go         | No-op                                                         |
| Different value (manual entry) | Include in `conflicts` (NOT written)                          |

Reconciliation operates at TWO granularities: (a) **threshold scalars** (`cycling.thresholds.ftp`, etc.) — one FieldKey per scalar, identical to the original change; (b) **zone bands** (`cycling.heartRateZones.z2.maxBpm`, etc.) — one FieldKey per band-bound, where each Z1-Z5 of each sport-kind table can independently land in `applied` or `conflicts`.

The success result is `{ ok: true, applied: WrittenField[], conflicts: ConflictItem[], payload: ZonesPayload }`. The `payload` field is the validated bridge response, returned so the UI can pass it back into `commitConflictResolution` without re-fetching. Conflicting values MUST NOT be written to the profile by `syncZones` itself — they are returned to the caller (the UI) for presentation. Silent fills ARE written eagerly during `syncZones` execution. `syncZones` SHALL re-read the profile inside the transaction that writes the fills, so an edit saved while Train2Go was being read is kept, not overwritten by the profile read before the fetch.

#### Scenario: A profile edit saved during the fetch is kept

- **GIVEN** the athlete renames their profile while `syncZones` is reading Train2Go
- **WHEN** `syncZones` writes its silent fills
- **THEN** the profile SHALL keep the new name and gain the silent fills

#### Scenario: Triathlete profile gets per-sport LTHR (silent fills)

- **GIVEN** the parsed `/user/details` payload has `payload.hrZones.cycling.z4Upper = 160` (bpm) and `payload.hrZones.running.z4Upper = 168` (bpm)
- **AND** the user's profile has both `cycling.thresholds.lthr` and `running.thresholds.lthr` empty
- **WHEN** `syncZones` runs
- **THEN** the result SHALL be `{ ok: true, applied: [{ field: "cycling.thresholds.lthr", value: 160 }, { field: "running.thresholds.lthr", value: 168 }], conflicts: [] }`
- **AND** `cycling.thresholds.lthr` SHALL be `160` after the call
- **AND** `running.thresholds.lthr` SHALL be `168` after the call
- **AND** swimming LTHR (the threshold scalar `swimming.thresholds.lthr`) SHALL NOT be written by the threshold-scalar code path (the threshold-scalar `FieldKey` set is unchanged from the shipped capability — see proposal "What Changes" — and Kaiord still has no domain consumer for swimming LTHR as a scalar; the band-level swimming HR path is a separate path covered by the next scenario)
- **NOTE**: Band-level writes (e.g., `swimming.heartRateZones.zones`) are governed by a SEPARATE requirement (the SPA-extension fallback-chain) and a SEPARATE scenario below — they DO populate from `payload.hrZones.generic` for triathletes; this scenario asserts the threshold-scalar path only.

#### Scenario: Triathlete swimming HR bands silent-filled from Generic block (band-level fallback)

- **GIVEN** the parsed payload has `payload.hrZones.cycling` (Specific) AND `payload.hrZones.generic` (Generic Karvonen-derived)
- **AND** `payload.hrZones.swimming` is absent (no Specific swimming block in T2G)
- **AND** the user's profile has `sportZones.swimming.heartRateZones.zones = []` (empty)
- **WHEN** `syncZones` runs
- **THEN** `sportZones.swimming.heartRateZones.zones` SHALL be silently filled from `payload.hrZones.generic` (per the SPA-extension fallback-chain Requirement)
- **AND** the result's `applied` SHALL include the five band-level keys for swimming HR (`swimming.heartRateZones.z1.minBpm`, etc.)
- **AND** `swimming.thresholds.lthr` (the threshold scalar) SHALL still NOT be written (this scenario covers the band-level path only; the FieldKey set for threshold scalars is unchanged)

#### Scenario: FTP precedence — z4Upper wins when both present

- **GIVEN** the parsed `/user/details` payload (raw bridge shape) has `payload.paces.cycling.z4Upper = 268` and `payload.paces.cycling.z5Lower = 270`
- **WHEN** the SPA-side `syncZones` use case maps payload → Kaiord-domain `incoming.cycling.thresholds.ftp`
- **THEN** `incoming.cycling.thresholds.ftp` SHALL equal `268` (z4Upper wins)
- **AND** the mapper SHALL log an informational warning that z4Upper and z5Lower disagree by more than 1 watt

#### Scenario: FTP fallback — z5Lower wins when z4Upper is absent

- **GIVEN** the parsed payload has `payload.paces.cycling.z4Upper` absent (the key is not present in the object) AND `payload.paces.cycling.z5Lower = 270`
- **WHEN** the SPA-side `syncZones` use case maps payload → Kaiord-domain `incoming.cycling.thresholds.ftp`
- **THEN** `incoming.cycling.thresholds.ftp` SHALL equal `270` (z5Lower fallback)
- **AND** no warning SHALL be logged (the fallback path is intentional)

#### Scenario: FTP fallback — z5Lower wins when z4Upper is zero

- **GIVEN** the parsed payload has `payload.paces.cycling.z4Upper = 0` (semantically equivalent to "absent" for a watt threshold) AND `payload.paces.cycling.z5Lower = 270`
- **WHEN** the SPA-side `syncZones` use case maps payload → Kaiord-domain `incoming.cycling.thresholds.ftp`
- **THEN** `incoming.cycling.thresholds.ftp` SHALL equal `270` (z5Lower fallback)
- **AND** no warning SHALL be logged

#### Scenario: Empty cycling.thresholds.ftp is filled silently

- **GIVEN** the user's profile has `cycling.thresholds.ftp = undefined`
- **AND** the parsed payload has `payload.paces.cycling.z4Upper = 270`
- **WHEN** `syncZones` runs
- **THEN** the profile SHALL be updated to `cycling.thresholds.ftp = 270`
- **AND** the field SHALL appear in `applied`, NOT in `conflicts`

#### Scenario: Manual FTP value differs from Train2Go — returned in conflicts, NOT written

- **GIVEN** the profile has `cycling.thresholds.ftp = 200` (manually entered)
- **AND** the parsed payload has `payload.paces.cycling.z4Upper = 270`
- **WHEN** `syncZones` runs
- **THEN** the result's `conflicts` SHALL include an entry for `cycling.thresholds.ftp` with `current = 200`, `incoming = 270`
- **AND** the persisted profile SHALL retain `cycling.thresholds.ftp = 200` (no write performed by `syncZones`)

### Requirement: `commitConflictResolution` applies user decisions

The `commitConflictResolution(profileId, decisions, persistence, transportPayload): Promise<void>` use case SHALL accept a `decisions: Record<FieldKey, 'accept' | 'reject'>` map and apply per-row decisions. For threshold scalars (FieldKeys ending in `.thresholds.<name>`, plus `heartRate.max`), `accept` writes the T2G scalar and `reject` is a no-op. For `bodyWeight`, `accept` records the T2G weight as today's weigh-in (see "Train2Go's weight is the athlete's current weight") and `reject` is a no-op. For band-level FieldKeys (`<sport>.<kind>.z<N>.<bound>`), the decisions are grouped by `<sport>.<kind>` and applied via the per-band merge rule defined in the band-level requirement above: the persisted `zones` array becomes the merge of the user's pre-sync values (for rejected bands) and the T2G values (for accepted bands). The function SHALL be idempotent — calling it twice with the same decisions produces the same final state. The SPA SHALL open a single confirmation dialog listing every conflicting field with both values (`Field: Kaiord-value → Train2Go-value`); the user SHALL be able to accept or reject each row independently. Cancelling the dialog SHALL discard only the conflicting writes; previously-committed silent fills (returned in `applied` from `syncZones`) SHALL remain.

#### Scenario: User rejects an FTP conflict; LTHR conflict accepted

- **GIVEN** the profile pre-sync has `cycling.thresholds.ftp = 200` and `running.thresholds.lthr = 150`
- **AND** `syncZones` returned two conflicts: FTP (200 → 270) and LTHR (150 → 168)
- **AND** the user clicks reject on the FTP row and accept on the LTHR row
- **WHEN** `commitConflictResolution` is called with `{ "cycling.thresholds.ftp": "reject", "running.thresholds.lthr": "accept" }`
- **THEN** the profile's `cycling.thresholds.ftp` SHALL stay at 200
- **AND** the profile's `running.thresholds.lthr` SHALL be 168

#### Scenario: User cancels the conflict dialog entirely

- **GIVEN** the athlete has no current weight (no weigh-in, no `profile.bodyWeight`), and the profile pre-sync has `cycling.thresholds.ftp = 200`, `running.thresholds.lthr = 150`
- **AND** `syncZones` produced one silent fill (`bodyWeight = 72` from T2G physio.weight) and two conflicts (FTP 200→270, LTHR 150→168)
- **WHEN** the user closes the conflict dialog without confirming any row (no `commitConflictResolution` call)
- **THEN** today's weigh-in of 72 kg SHALL remain (already recorded by `syncZones`)
- **AND** `cycling.thresholds.ftp` SHALL stay at 200
- **AND** `running.thresholds.lthr` SHALL stay at 150

#### Scenario: commitConflictResolution is idempotent

- **GIVEN** the profile pre-call has `cycling.thresholds.ftp = 200`
- **AND** the conflict for `cycling.thresholds.ftp` has `incoming = 270`
- **WHEN** `commitConflictResolution` is called twice with `{ "cycling.thresholds.ftp": "accept" }`
- **THEN** after both calls the profile's `cycling.thresholds.ftp` SHALL be `270`
- **AND** the second call SHALL produce no additional side effects

#### Scenario: Mixed band-level decisions for the same sport-kind table

- **GIVEN** the profile pre-sync has `sportZones.cycling.heartRateZones.zones`, with conflicts and decisions per the table below (single source of truth — every cell is mechanically encodable in `it.each`):

  | Band | bound  | persisted | T2G | differs? | user decision |
  | ---- | ------ | --------- | --- | -------- | ------------- |
  | Z1   | minBpm | 100       | 107 | yes      | accept        |
  | Z1   | maxBpm | 130       | 133 | yes      | accept        |
  | Z2   | minBpm | 131       | 134 | yes      | reject        |
  | Z2   | maxBpm | 145       | 147 | yes      | reject        |
  | Z3   | minBpm | 146       | 148 | yes      | reject        |
  | Z3   | maxBpm | 160       | 160 | no       | n/a           |
  | Z4   | minBpm | 161       | 161 | no       | n/a           |
  | Z4   | maxBpm | 170       | 174 | yes      | accept        |
  | Z5   | minBpm | 171       | 175 | yes      | accept        |
  | Z5   | maxBpm | 187       | 187 | no       | n/a           |

- **AND** `syncZones` therefore emits 7 conflict rows (the 7 rows where `differs? = yes`); `n/a` rows are NOT in the conflict set
- **AND** the user accept set is the 4 rows marked `accept` and the reject set is the 3 rows marked `reject`
- **WHEN** `commitConflictResolution` is called with that decision map
- **THEN** the persisted `zones[0]` SHALL equal `{ zone: 1, name: "Recovery", minBpm: 107, maxBpm: 133 }` (both bounds accepted; Z1 fully takes T2G)
- **AND** `zones[1]` SHALL equal `{ zone: 2, name: "Aerobic", minBpm: 131, maxBpm: 145 }` (both bounds rejected; Z2 keeps pre-sync values byte-identical)
- **AND** `zones[2]` SHALL equal `{ zone: 3, name: "Tempo", minBpm: 146, maxBpm: 160 }` (Z3.minBpm rejected → stays 146; Z3.maxBpm was never in conflict → stays 160)
- **AND** `zones[3]` SHALL equal `{ zone: 4, name: "Threshold", minBpm: 161, maxBpm: 174 }` (Z4.minBpm not in conflict → stays 161; Z4.maxBpm accepted → becomes 174)
- **AND** `zones[4]` SHALL equal `{ zone: 5, name: "VO2 Max", minBpm: 175, maxBpm: 187 }` (Z5.minBpm accepted → becomes 175; Z5.maxBpm not in conflict → stays 187, which happens to equal T2G's value)

> **Test-author note**: the `name` field strings (`"Recovery"`, `"Aerobic"`, `"Tempo"`, `"Threshold"`, `"VO2 Max"`) in the THEN clauses MUST be sourced from `DEFAULT_HEART_RATE_ZONES` at test runtime (e.g., `expect(zones[1].name).toBe(DEFAULT_HEART_RATE_ZONES[1].name)`), NOT hardcoded as string literals — so a rename of the constant fails this scenario noisily rather than silently desyncing.
