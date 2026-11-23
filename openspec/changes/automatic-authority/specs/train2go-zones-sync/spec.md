## MODIFIED Requirements

### Requirement: `commitConflictResolution` applies user decisions

The `commitConflictResolution(profileId, decisions, persistence, transportPayload): Promise<void>` use case SHALL accept a `decisions: Record<FieldKey, 'accept' | 'reject'>` map and apply per-row decisions. For threshold scalars (FieldKeys ending in `.thresholds.<name>`, plus `heartRate.max`), `accept` writes the T2G scalar and `reject` is a no-op. For `bodyWeight`, `accept` records the T2G weight as today's weigh-in (see "Train2Go's weight is the athlete's current weight") and `reject` is a no-op. For band-level FieldKeys (`<sport>.<kind>.z<N>.<bound>`), the decisions are grouped by `<sport>.<kind>` and applied via the per-band merge rule defined in the band-level requirement above: the persisted `zones` array becomes the merge of the user's pre-sync values (for rejected bands) and the T2G values (for accepted bands). The function SHALL be idempotent — calling it twice with the same decisions produces the same final state. The SPA SHALL NOT ask which value decides: the athlete's own values stay, and nothing is committed until the athlete acts. Once per set of differing values it SHALL show one notice saying that Kaiord kept the athlete's numbers, with one action that commits every conflicting field as `accept`; previously-committed silent fills (returned in `applied` from `syncZones`) SHALL remain whatever the athlete does.

#### Scenario: User rejects an FTP conflict; LTHR conflict accepted

- **GIVEN** the profile pre-sync has `cycling.thresholds.ftp = 200` and `running.thresholds.lthr = 150`
- **AND** `syncZones` returned two conflicts: FTP (200 → 270) and LTHR (150 → 168)
- **WHEN** `commitConflictResolution` is called with `{ "cycling.thresholds.ftp": "reject", "running.thresholds.lthr": "accept" }`
- **THEN** the profile's `cycling.thresholds.ftp` SHALL stay at 200
- **AND** the profile's `running.thresholds.lthr` SHALL be 168

#### Scenario: User cancels the conflict dialog entirely

- **GIVEN** the athlete has no current weight (no weigh-in, no `profile.bodyWeight`), and the profile pre-sync has `cycling.thresholds.ftp = 200`, `running.thresholds.lthr = 150`
- **AND** `syncZones` produced one silent fill (`bodyWeight = 72` from T2G physio.weight) and two conflicts (FTP 200→270, LTHR 150→168)
- **WHEN** the athlete lets the notice go without using its action (no `commitConflictResolution` call)
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

#### Scenario: Train2Go's numbers are taken in one action

- **GIVEN** `syncZones` returned conflicts for FTP and the cycling power bands
- **WHEN** the athlete uses "Use Train2Go's" on the notice
- **THEN** `commitConflictResolution` SHALL be called with every conflicting field mapped to `accept`

#### Scenario: The same differing values are offered once

- **GIVEN** the notice was shown for a set of differing values
- **WHEN** a later sync returns the same set
- **THEN** no notice SHALL be shown again

## REMOVED Requirements

### Requirement: Conflict dialog groups band-level conflicts by sport-kind table

**Reason**: The conflict dialog asked the athlete which value decides on every sync with a difference (#1666, ADR 0003 "decide and offer undo"). It is removed: the athlete's own values win, and one notice offers Train2Go's instead.

**Migration**: see the modified "`commitConflictResolution` applies user decisions" and `spa-authority`, "Nothing asks which Platform decides".

### Requirement: FTP scalar conflict couples with cycling power band conflicts

**Reason**: The coupling existed so the dialog could not accept FTP without its power bands. The one action left accepts every conflicting field together, so FTP and its bands can no longer be split.

**Migration**: none; "Use Train2Go's" accepts FTP and the cycling power bands as one.
