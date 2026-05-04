> Synced: 2026-05-03 (train2go-zones-sync)

# train2go-zones-sync Specification

## Purpose

Opt-in propagation of athlete threshold and physiological values from Train2Go
into the active Kaiord profile. The capability runs on explicit user-trigger
events only (link-time fan-out, manual calendar sync) — NEVER on heartbeat — and
applies an "ask before overwrite" conflict policy that preserves manually-entered
Kaiord values unless the user accepts each per-row diff.
## Requirements
### Requirement: Zone-sync toggle is opt-in per linked Train2Go account

The SPA SHALL expose a `Sync zones` toggle on the Linked Account row for Train2Go. The toggle's state MUST persist alongside the linked-account record (`profile.linkedAccounts[i].syncZones: boolean`) and MUST default to `false` when an account is first linked. Toggling it OFF SHALL NOT revert previously-synced threshold values in the profile (toggle controls future syncs only).

#### Scenario: First-time link defaults the toggle off

- **WHEN** a user runs the Train2Go connect dance for the first time
- **THEN** the resulting `linkedAccounts[i]` row SHALL have `syncZones: false`
- **AND** no zones-sync request SHALL be issued

#### Scenario: Disabling the toggle does not revert prior data

- **GIVEN** a user previously synced zones with the toggle on, and FTP=270 was written to their profile
- **WHEN** the user toggles `Sync zones` off
- **THEN** the persisted FTP value SHALL remain 270
- **AND** subsequent calendar syncs SHALL NOT issue a zones-fetch

### Requirement: Zone sync runs at link time and on manual sync, never on heartbeat

When `syncZones` is `true` for a linked account, the SPA SHALL invoke the zones-sync use case in exactly two places: immediately after `attemptLink` resolves successfully, and at the tail of the `useSyncCallback` weekly-read flow. Heartbeat / detection pings (`useTrain2GoDetection`) MUST NOT trigger a zones sync — mirroring the `attempt-link.ts` invariant that heartbeats never mutate profile data.

#### Scenario: Successful link with toggle on triggers a single sync

- **GIVEN** the user enables `Sync zones` and runs the connect dance
- **WHEN** `attemptLink` resolves with `{ ok: true }`
- **THEN** the SPA SHALL invoke `syncZones(profileId, transport)` exactly once

#### Scenario: Manual sync click triggers a zones-sync after the weekly read

- **GIVEN** an existing linked Train2Go account with `syncZones: true`
- **WHEN** the user clicks the calendar header sync button
- **THEN** the SPA SHALL execute the weekly read first
- **AND** invoke `syncZones(profileId, transport)` after the weekly read resolves

#### Scenario: Heartbeat detection does not sync zones

- **GIVEN** a linked Train2Go account with `syncZones: true`
- **WHEN** the periodic `useTrain2GoDetection` ping fires
- **THEN** the SPA SHALL NOT invoke `syncZones`

### Requirement: `syncZones` returns conflicts unwritten, silent fills are committed eagerly

The `syncZones(profileId, transport, repo): Promise<SyncZonesResult>` use case SHALL reconcile each Train2Go field against the persisted Kaiord profile under the following rules:

| Kaiord field state             | Action                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Empty / absent                 | Write the Train2Go value silently and include it in `applied` |
| Same value as Train2Go         | No-op                                                         |
| Different value (manual entry) | Include in `conflicts` (NOT written)                          |

Reconciliation operates at TWO granularities: (a) **threshold scalars** (`cycling.thresholds.ftp`, etc.) — one FieldKey per scalar, identical to the original change; (b) **zone bands** (`cycling.heartRateZones.z2.maxBpm`, etc.) — one FieldKey per band-bound, where each Z1-Z5 of each sport-kind table can independently land in `applied` or `conflicts`.

The success result is `{ ok: true, applied: WrittenField[], conflicts: ConflictItem[], payload: ZonesPayload }`. The `payload` field is the validated bridge response, returned so the UI can pass it back into `commitConflictResolution` without re-fetching. Conflicting values MUST NOT be written to the profile by `syncZones` itself — they are returned to the caller (the UI) for presentation. Silent fills ARE written eagerly during `syncZones` execution.

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

The `commitConflictResolution(profileId, decisions, repo, transportPayload): Promise<void>` use case SHALL accept a `decisions: Record<FieldKey, 'accept' | 'reject'>` map and apply per-row decisions. For threshold scalars (FieldKeys ending in `.thresholds.<name>`, plus `bodyWeight` and `heartRate.max`), `accept` writes the T2G scalar and `reject` is a no-op. For band-level FieldKeys (`<sport>.<kind>.z<N>.<bound>`), the decisions are grouped by `<sport>.<kind>` and applied via the per-band merge rule defined in the band-level requirement above: the persisted `zones` array becomes the merge of the user's pre-sync values (for rejected bands) and the T2G values (for accepted bands). The function SHALL be idempotent — calling it twice with the same decisions produces the same final state. The SPA SHALL open a single confirmation dialog listing every conflicting field with both values (`Field: Kaiord-value → Train2Go-value`); the user SHALL be able to accept or reject each row independently. Cancelling the dialog SHALL discard only the conflicting writes; previously-committed silent fills (returned in `applied` from `syncZones`) SHALL remain.

#### Scenario: User rejects an FTP conflict; LTHR conflict accepted

- **GIVEN** the profile pre-sync has `cycling.thresholds.ftp = 200` and `running.thresholds.lthr = 150`
- **AND** `syncZones` returned two conflicts: FTP (200 → 270) and LTHR (150 → 168)
- **AND** the user clicks reject on the FTP row and accept on the LTHR row
- **WHEN** `commitConflictResolution` is called with `{ "cycling.thresholds.ftp": "reject", "running.thresholds.lthr": "accept" }`
- **THEN** the profile's `cycling.thresholds.ftp` SHALL stay at 200
- **AND** the profile's `running.thresholds.lthr` SHALL be 168

#### Scenario: User cancels the conflict dialog entirely

- **GIVEN** the profile pre-sync has `bodyWeight = undefined`, `cycling.thresholds.ftp = 200`, `running.thresholds.lthr = 150`
- **AND** `syncZones` produced one silent fill (`bodyWeight = 72` from T2G physio.weight) and two conflicts (FTP 200→270, LTHR 150→168)
- **WHEN** the user closes the conflict dialog without confirming any row (no `commitConflictResolution` call)
- **THEN** the profile SHALL retain the silently-filled `bodyWeight = 72` (already committed by `syncZones`)
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

### Requirement: Zones-sync failure does not break linking or calendar sync

The zones-sync flow SHALL be a non-blocking fan-out from the connect and weekly-sync paths. Any error during zones fetch (transport failure, shape mismatch, rate limit) MUST NOT propagate up to abort the parent flow. Failures SHALL surface as a non-blocking toast and SHALL be logged to analytics; the user SHALL still see the link succeed (resp. the calendar sync complete).

#### Scenario: Bridge returns a transport error during zones sync at link time

- **GIVEN** the user enables `Sync zones` and runs connect
- **AND** the bridge's `read-details` action returns `{ ok: false, error: "..." }`
- **WHEN** `attemptLink` is processed
- **THEN** the link SHALL still be persisted in `linkedAccounts`
- **AND** the SPA SHALL show a non-blocking toast whose first argument is the static constant `TOAST_ZONES_FETCH_FAILED` (defined as `'Couldn't fetch zones from Train2Go — try again later'` at the top of `sync-zones.ts`)

#### Scenario: Train2Go returns an unexpected payload shape

- **GIVEN** the bridge returns `{ ok: true, data: { unexpected: "shape" } }`
- **WHEN** the zones mapper validates the payload
- **THEN** the mapper SHALL return `{ ok: false, reason: "shape-mismatch" }`
- **AND** zones-sync SHALL NOT mutate the profile
- **AND** an analytics event `train2go.zones-sync.shape-mismatch` SHALL be emitted

### Requirement: Full Z1-Z5 band tables are written per sport when present

When `payload.hrZones.<sport>` (Specific) OR `payload.hrZones.generic` (Generic fallback) is present for a given sport, the `syncZones` use case SHALL build a complete `HeartRateZone[]` array (`[{ zone: 1, name: "Recovery", minBpm, maxBpm }, ..., { zone: 5, name: "VO2 Max", minBpm, maxBpm }]`) and write it to `profile.sportZones.<sport>.heartRateZones.zones`. The same applies to cycling power bands written to `profile.sportZones.cycling.powerZones.zones` (as `PowerZone[]` with `minPercent / maxPercent` derived from the watts band relative to `cycling.thresholds.ftp`) and to running/swimming pace bands written to `profile.sportZones.<sport>.paceZones.zones` (as `PaceZone[]` with `minPace / maxPace` in integer seconds and the existing `unit` discriminator). The zone names follow the canonical Kaiord defaults (`DEFAULT_HEART_RATE_ZONES`, `DEFAULT_POWER_ZONES`).

#### Scenario: HR bands written silently to an empty profile

- **GIVEN** a profile with `sportZones.cycling.heartRateZones.zones = []`
- **AND** `payload.hrZones.cycling = { z1: { lower: 107, upper: 133 }, z2: { lower: 134, upper: 147 }, z3: { lower: 148, upper: 160 }, z4: { lower: 161, upper: 174 }, z5: { lower: 175, upper: 187 } }`
- **WHEN** `syncZones` runs
- **THEN** the persisted `sportZones.cycling.heartRateZones.zones` SHALL contain five `HeartRateZone` entries with `minBpm`/`maxBpm` matching the payload bands
- **AND** the result's `applied` SHALL include the five band-level field keys for cycling HR

#### Scenario: Cycling power bands stored as percentages of FTP (using T2G's z4Upper as divisor)

- **GIVEN** `payload.paces.cycling = { z1: { lower: 111, upper: 149 }, ..., z5: { lower: 269, upper: 386 }, z4Upper: 268 }`
- **AND** the user's persisted profile has `cycling.thresholds.ftp = 200` (manually entered, differs from T2G)
- **WHEN** `syncZones` writes cycling power bands
- **THEN** `sportZones.cycling.powerZones.zones[0]` SHALL have `minPercent = Math.round(111/268*100) = 41` and `maxPercent = Math.round(149/268*100) = 56` — exact integer values (deterministic rounding via `Math.round`); the divisor is T2G's `payload.paces.cycling.z4Upper = 268`, NOT the persisted FTP=200 (per design D-FB6: bands convert against T2G's view of FTP, never the persisted FTP)
- **AND** the FTP scalar conflict (200 vs 268) SHALL surface as its own conflict row (`cycling.thresholds.ftp`), independent of the power-band rows
- **AND** if the user rejects the FTP scalar conflict, the power bands SHALL still be persisted as %FTP relative to T2G's 268 (the bands were silent-filled before the dialog opens, per the per-band conflict policy below)

#### Scenario: Power-zone count mismatch — T2G's 5 bands replace Kaiord's 7 default zones

- **GIVEN** the persisted profile has `sportZones.cycling.powerZones.zones` populated with the 7-entry `DEFAULT_POWER_ZONES` shape (Z1=Active Recovery, ..., Z6=Anaerobic Capacity, Z7=Neuromuscular Power)
- **AND** the T2G payload provides Z1-Z5 cycling power bands with `payload.paces.cycling.z4Upper = 268`
- **WHEN** `syncZones` runs
- **THEN** the post-sync `sportZones.cycling.powerZones.zones.length` SHALL equal `5` (NOT 7)
- **AND** the persisted entries SHALL be Z1-Z5 derived from T2G's bands; the original Z6 and Z7 entries SHALL NOT be present (per D-FB3: T2G is the source of truth at sync time; preserving Z6/Z7 would mix sources)

#### Scenario: Cycling power bands skipped when T2G FTP is absent

- **GIVEN** `payload.paces.cycling.z4Upper` is absent OR zero (no FTP test result in T2G)
- **AND** `payload.paces.cycling = { z1..z5 }` bands are present
- **WHEN** `syncZones` runs
- **THEN** the cycling power band write SHALL be SKIPPED (no entry in `applied` for `cycling.powerZones.*`, no entry in `conflicts`)
- **AND** an info-level log SHALL be emitted (`"cycling power bands skipped: T2G FTP missing"`)
- **AND** the persisted `sportZones.cycling.powerZones.zones` SHALL stay byte-identical to its pre-sync value

#### Scenario: Running pace bands stored as seconds with min_per_km unit (lower/upper inversion)

- **GIVEN** `payload.paces.running.z4 = { lower: { min: 4, sec: 44 }, upper: { min: 4, sec: 10 } }`
- **AND** the mapping convention is: T2G `lower` is the SLOWER edge of the band (larger seconds-per-km) and T2G `upper` is the FASTER edge (smaller seconds-per-km); the Kaiord schema stores `minPace` as the smaller numeric (faster) and `maxPace` as the larger numeric (slower)
- **WHEN** `syncZones` writes running pace bands
- **THEN** `sportZones.running.paceZones.zones[3].minPace` SHALL equal `4 * 60 + 10` = `250` seconds (the FASTER bound, mapped from T2G `upper`)
- **AND** `sportZones.running.paceZones.zones[3].maxPace` SHALL equal `4 * 60 + 44` = `284` seconds (the SLOWER bound, mapped from T2G `lower`)
- **AND** `sportZones.running.paceZones.zones[3].unit` SHALL equal `"min_per_km"`
- **AND** the invariant `minPace <= maxPace` SHALL hold for every persisted pace band

#### Scenario: Pace minPace/maxPace invariant holds across all bands

- **GIVEN** any T2G pace block where every band has `lower.min*60+lower.sec >= upper.min*60+upper.sec` (i.e., seconds(lower) >= seconds(upper) — slower edge first, the natural T2G HTML convention)
- **WHEN** the mapper writes the pace bands
- **THEN** every `paceZones.zones[i]` SHALL satisfy `minPace <= maxPace`
- **AND** the mapper SHALL NOT swap when the inputs already satisfy this — the invariant is enforced by the lower→maxPace, upper→minPace assignment, not by an `if (a > b) swap` step

### Requirement: Per-band conflict policy with full-array commit on accept

The `syncZones` use case SHALL detect band-level conflicts independently for each Z-band of each `<sport>.{heartRateZones, powerZones, paceZones}` table. A conflict is emitted as a separate `ConflictItem` per band (and per bound, e.g., one row for `cycling.heartRateZones.z2.minBpm` and a separate row for `cycling.heartRateZones.z2.maxBpm` when both differ).

**Equality semantics (load-bearing):** the conflict-detection comparison operates on the ROUNDED Kaiord-domain value, NOT the raw bridge-domain value. Specifically:

- HR bands: integer bpm vs integer bpm.
- Power bands: integer percent vs integer percent (after the watts→% rounding per D-FB6, using T2G's `z4Upper` as divisor on both sides).
- Pace bands: integer seconds vs integer seconds (after the `min*60+sec` conversion per D-FB7).

This means a re-sync of identical T2G data SHALL produce ZERO conflict rows — round-trip stability is the contract. A persisted Z4 of `90% FTP` matches an incoming watts band that rounds to `90% FTP`, regardless of the original watts value. Floating-point comparisons MUST NOT be used.

The `commitConflictResolution` use case SHALL apply per-row decisions; for any sport-kind table where AT LEAST ONE band is `accept`, the persisted `zones` array SHALL be a merge: accepted bands take the T2G value; rejected bands keep the user's pre-sync value. If ALL bands of a sport-kind table are `reject`, the persisted array SHALL stay unchanged.

#### Scenario: Full-empty table is silent-filled, no conflict

- **GIVEN** `sportZones.cycling.powerZones.zones = []`
- **AND** the payload provides Z1-Z5 cycling power bands
- **WHEN** `syncZones` runs
- **THEN** the result's `conflicts` SHALL contain NO cycling-power band entries
- **AND** the persisted `sportZones.cycling.powerZones.zones` SHALL contain the five payload-derived bands

#### Scenario: Single band conflict with merge-on-accept

- **GIVEN** the user's profile has `sportZones.cycling.heartRateZones.zones` populated with five bands (bands 1-3 and 5 match T2G; band 4 differs: persisted `Z4: 160-170`, T2G `Z4: 161-174`)
- **AND** the user accepts both `cycling.heartRateZones.z4.minBpm` (160→161) and `cycling.heartRateZones.z4.maxBpm` (170→174)
- **WHEN** `commitConflictResolution` is called with those two `accept` decisions
- **THEN** the persisted `zones[3]` SHALL equal `{ zone: 4, name: "Threshold", minBpm: 161, maxBpm: 174 }`
- **AND** `zones[0..2]` and `zones[4]` SHALL stay byte-identical to their pre-sync values

#### Scenario: All-reject leaves the table untouched

- **GIVEN** the user's profile has manually-tuned cycling power bands
- **AND** every band differs from the T2G payload
- **AND** the user clicks `reject` on every cycling-power conflict row
- **WHEN** `commitConflictResolution` is called with all decisions = `reject`
- **THEN** the persisted `sportZones.cycling.powerZones.zones` SHALL stay byte-identical to its pre-sync state

#### Scenario: Re-sync of identical T2G data produces zero conflicts (round-trip stability)

- **GIVEN** a profile previously sync'd from T2G (cycling power bands persisted as `[{Z1 minPercent: 41, maxPercent: 56}, ..., {Z4 minPercent: 90, maxPercent: 100}, {Z5 minPercent: 100, maxPercent: 144}]` derived from FTP=268 and watts bands `Z1 111-149 W, ..., Z4 240-268 W, Z5 269-386 W`)
- **AND** T2G's data is unchanged since the last sync (`payload.paces.cycling.z4Upper = 268`, same Z1-Z5 watts)
- **WHEN** `syncZones` runs a second time
- **THEN** the result's `conflicts` SHALL be empty for every cycling-power band
- **AND** the result's `applied` SHALL be empty for every cycling-power band (no-op when persisted == incoming after rounding)
- **AND** the persisted `zones` SHALL stay byte-identical
- **AND** equality comparison SHALL use the rounded Kaiord-domain integers (`minPercent: 41 == 41`), NOT the raw bridge watts (`minWatts: 111`)
- **AND** the same property SHALL hold for HR bands (integer bpm equality across re-syncs of identical T2G data) and for pace bands (integer seconds equality across re-syncs of identical T2G `{min, sec}` data) — the round-trip stability invariant applies uniformly to all three domains.

