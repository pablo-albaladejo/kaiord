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

The `syncZones` use case SHALL detect band-level conflicts independently for each Z-band of each `<sport>.{heartRateZones, powerZones, paceZones}` table — but ONLY when the table's classified state (per the Zone-table customization states requirement) is `user-customized` OR `train2go-synced-edited`. Tables in `empty`, `default-template`, `method-derived`, OR `train2go-synced-clean` states SHALL be silent-replaced from T2G without emitting any conflict rows.

For tables that DO produce conflicts, the existing equality semantics apply: HR bpm integer equality, power percent integer equality (after `Math.round((watts/z4Upper)*100)`), pace seconds integer equality. Round-trip stability across re-syncs is preserved.

The `commitConflictResolution` use case applies per-row decisions; for any sport-kind table where AT LEAST ONE band is `accept`, the persisted `zones` array SHALL be a merge: accepted bands take T2G; rejected bands keep pre-sync values. After the merge, the table's `method` field is updated:

- If ALL conflicting bands of a table are `accept` → `method := "train2go"` and that table's slice in `lastSyncedZonesSnapshot` is replaced with the post-merge zones.
- If ANY band of a table is `reject` → `method := "user"` (the user explicitly chose to keep some pre-sync value over T2G's; the table is now user-customized) and the snapshot for that table reflects the post-merge state.
- If ALL bands of a table are `reject` → `method` stays at its pre-call value; snapshot is unchanged.

#### Scenario: First-sync against fresh profile produces zero conflicts (was previously 30+ rows)

- **GIVEN** a profile created via `createNewProfile(...)` with `cycling.heartRateZones = { method: "custom", zones: DEFAULT_HEART_RATE_ZONES }` (5 entries, all-zero) AND `cycling.powerZones = { method: "coggan-7", zones: calculatePowerZones("coggan-7") }` (7 Coggan-default entries)
- **AND** the T2G payload provides full Z1-Z5 bands for cycling HR (Generic) + cycling power (watts) + running/swimming HR (Generic) + running/swimming pace
- **WHEN** `syncZones` runs
- **THEN** the result's `conflicts` SHALL be empty (zero rows for any sport-kind band table)
- **AND** the result's `applied` SHALL contain entries for every band the classifier silent-filled (5 sports-kinds × ~10 entries each = ~50 applied)
- **AND** all silent-filled tables SHALL have `method = "train2go"` post-sync
- **AND** the linked account's `lastSyncedZonesSnapshot` SHALL be fully populated

#### Scenario: User-customized table with all-reject keeps method = "user" and unchanged snapshot

- **GIVEN** a profile with `cycling.heartRateZones = { method: "user", zones: [...customized] }`
- **AND** T2G provides bands that differ in 5 places
- **AND** the user clicks `Keep current` on the cycling-HR group in the dialog
- **WHEN** `commitConflictResolution` is called with all 5 decisions = `reject`
- **THEN** the persisted `cycling.heartRateZones.zones` SHALL stay byte-identical
- **AND** `cycling.heartRateZones.method` SHALL stay `"user"` (no change)
- **AND** `lastSyncedZonesSnapshot.cyclingHr` SHALL stay at its pre-call value (no update)

### Requirement: Zone-table customization states drive reconciliation strategy

The `syncZones` use case SHALL classify each `<sport>.{heartRateZones, powerZones, paceZones}` table on the persisted profile into one of six canonical states based on the table's `method` field, the zones content, the relevant threshold (FTP/LTHR/threshold pace), and the linked account's `lastSyncedZonesSnapshot`. State names are TypeScript string literals — used identically across spec, design, tests, and code:

```ts
type ZoneTableState =
  | "empty"
  | "default-template"
  | "method-derived"
  | "train2go-synced-clean"
  | "train2go-synced-edited"
  | "user-customized";
```

The state determines the reconcile strategy:

| State                    | Detection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Strategy                                                                                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `empty`                  | `zones` missing OR `zones.length === 0`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Silent-replace from T2G; set `method = "train2go"`; record snapshot                                                                                                                                             |
| `default-template`       | HR/pace ONLY: `method = "custom"` AND zones equal canonical seed (HR all-zero × 5 entries; pace all-zero × 5 entries). Cycling power on a fresh profile is NOT default-template (factory seeds `method = "coggan-7"` + Coggan defaults — see `method-derived`).                                                                                                                                                                                                                                                                                                                                                                                | Silent-replace; set `method = "train2go"`; record snapshot                                                                                                                                                      |
| `method-derived`         | `method ∈ registry-of-formula-ids` (the union of `HR_METHODS`, `POWER_METHODS`, `PACE_METHODS` in `lib/zone-methods/`) AND zones equal `calculate(method, currentThreshold)` AND threshold is present and > 0. **Threshold-fallback rule:** when method is a formula id but the relevant threshold is absent or zero, classifier falls through: zones empty → `empty`; zones equal seed → `default-template`; otherwise → `user-customized` (content-detection tail rule). Power's `coggan-7` derives without threshold (fixed %FTP defaults), so the threshold-fallback applies only to HR (`karvonen-5`, etc.) and pace (`daniels-5`, etc.). | Silent-replace; set `method = "train2go"`; record snapshot. The original method id is OVERWRITTEN to `"train2go"` (intentional — see D-MA4)                                                                     |
| `train2go-synced-clean`  | `method = "train2go"` AND `lastSyncedZonesSnapshot.<sport><Kind>` equals persisted zones (structural integer equality, order-sensitive index-by-index).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Silent re-sync; method stays `"train2go"`; snapshot updated to incoming (timestamp updates even if values byte-identical)                                                                                       |
| `train2go-synced-edited` | `method = "train2go"` AND persisted zones differ from snapshot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Per-band conflict for bands where `persisted ≠ incoming AND persisted ≠ snapshot` (i.e., user edited that band since last sync). Bands matching either incoming OR snapshot are silent (no conflict, no write). |
| `user-customized`        | `method = "user"` OR content-detection tail rule (none of the above match AND zones populated).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Per-band conflict for every band where `persisted ≠ incoming` (existing shipped behavior).                                                                                                                      |

**Equality semantics:** zone-array equality is structural integer equality — each band compared field-by-field via `===` on integer values (HR `minBpm`/`maxBpm`, power `minPercent`/`maxPercent`, pace `minPace`/`maxPace`/`unit` string). Order-sensitive (`zones[0]` compared with `snapshot.<sportKind>[0]`). Snapshot zones are stored at integer-rounded Kaiord-domain granularity (per the prior change's D-FB6/D-FB7 round-trip stability).

#### Scenario: Empty zone table is classified as `empty` and silent-filled

- **GIVEN** a profile with `running.paceZones = { method: "custom", zones: [] }` (factory default for pace tables — empty array)
- **AND** the T2G payload provides Z1-Z5 running pace bands
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL return state `"empty"` for `running.paceZones`
- **AND** the result's `conflicts` SHALL contain NO entries for `running.paceZones.*`
- **AND** the persisted `running.paceZones.zones` SHALL contain T2G's 5 bands
- **AND** `running.paceZones.method` SHALL equal `"train2go"`

#### Scenario: First sync against a freshly-created profile produces zero conflict rows

- **GIVEN** a profile created via `createNewProfile(...)` with no manual edits and no prior sync
- **AND** `cycling.heartRateZones = { method: "custom", zones: DEFAULT_HEART_RATE_ZONES }` (5 entries, all `{minBpm: 0, maxBpm: 0}`) — classifier returns `"default-template"`
- **AND** `cycling.powerZones = { method: "coggan-7", zones: calculatePowerZones("coggan-7") }` (7 entries, Coggan defaults) — classifier returns `"method-derived"` (NOT `"default-template"` — power Coggan-7 derivation is its own path)
- **AND** `running.heartRateZones`, `swimming.heartRateZones` follow the same `"custom"` + all-zero pattern — classifier returns `"default-template"` for each
- **AND** the T2G payload provides full Z1-Z5 bands for HR (Generic) + cycling power + run/swim pace
- **WHEN** `syncZones` runs
- **THEN** the result's `conflicts` SHALL be empty (zero rows for HR, power, or pace tables)
- **AND** the persisted `cycling.heartRateZones.zones` SHALL contain T2G's 5 bands; `method` SHALL equal `"train2go"`
- **AND** the persisted `cycling.powerZones.zones` SHALL contain T2G's 5 bands (NOT 7 — the 7-entry Coggan default was silently replaced); `method` SHALL equal `"train2go"` (the original `"coggan-7"` is intentionally overwritten)
- **AND** the linked account's `lastSyncedZonesSnapshot` SHALL be populated with the post-sync zone arrays

#### Scenario: Re-sync against unchanged T2G data produces zero conflict rows

- **GIVEN** a profile that previously sync'd from T2G and has `cycling.heartRateZones = { method: "train2go", zones: [Z1..Z5 from T2G] }`
- **AND** the linked account's `lastSyncedZonesSnapshot.cyclingHr` equals the persisted `cycling.heartRateZones.zones`
- **AND** T2G's data is unchanged since the last sync
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL return state `"train2go-synced-clean"` for `cycling.heartRateZones`
- **AND** the result's `conflicts` SHALL be empty
- **AND** the result's `applied` SHALL be empty (no-op when persisted == incoming after rounding)
- **AND** the persisted profile zones SHALL stay byte-identical
- **AND** the snapshot's `syncedAt` SHALL be updated to the new sync time; the zone arrays SHALL be byte-identical (snapshot equality is integer-rounded values, so the timestamp update is a no-op for the comparison contract on the next sync)

#### Scenario: HR formula-without-threshold falls through to content-detection

- **GIVEN** a profile with `running.heartRateZones = { method: "karvonen-5", zones: DEFAULT_HEART_RATE_ZONES }` (method is a formula id BUT `running.thresholds.lthr` is `undefined`)
- **AND** the T2G payload provides Z1-Z5 running HR bands
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL fall through the `"method-derived"` detection (no threshold to compute against)
- **AND** because zones equal the all-zero seed, the classifier SHALL return `"default-template"`
- **AND** the result's `conflicts` SHALL contain NO entries for `running.heartRateZones.*`
- **AND** the persisted `running.heartRateZones.method` SHALL equal `"train2go"` post-sync

#### Scenario: User edits a band post-sync, then re-syncs — only the edited band conflicts

- **GIVEN** a profile with `cycling.heartRateZones = { method: "train2go", zones: [{Z1: 107-133}, {Z2: 134-147}, {Z3: 148-160}, {Z4: 161-174}, {Z5: 175-187}] }`
- **AND** `lastSyncedZonesSnapshot.cyclingHr` equals the same array
- **AND** the user manually edits Z2 in the Profile Manager: `Z2.maxBpm` from `147` to `145`
- **AND** the ZoneEditor save handler flips `method = "user"` (per D-MA3)
- **AND** T2G re-syncs with unchanged data
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL return state `"user-customized"` (because method is now `"user"`)
- **AND** the result's `conflicts` SHALL include exactly one entry: `{ field: "cycling.heartRateZones.z2.maxBpm", current: 145, incoming: 147 }`
- **AND** the bands not edited (Z1, Z3, Z4, Z5) SHALL NOT appear in conflicts (they match incoming)
- **AND** Z2.minBpm SHALL NOT appear in conflicts (user only edited maxBpm)

#### Scenario: User edits a band but keeps method = "train2go" (snapshot-diff path)

- **GIVEN** a profile with `cycling.heartRateZones = { method: "train2go", zones: [Z1..Z5 from T2G] }`
- **AND** `lastSyncedZonesSnapshot.cyclingHr` equals the same array
- **AND** the user manually edits Z2.maxBpm from `147` to `145` via a code path that bypasses the ZoneEditor save handler (e.g., the schema-migration tail rule did not yet reclassify; OR a future bypass path)
- **AND** as a result `cycling.heartRateZones.method` is still `"train2go"` but persisted Z2.maxBpm is `145` while snapshot says `147`
- **AND** T2G provides the same data (Z2.maxBpm = 147)
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL return state `"train2go-synced-edited"` (method = "train2go" but zones differ from snapshot)
- **AND** the result's `conflicts` SHALL include exactly one entry: `{ field: "cycling.heartRateZones.z2.maxBpm", current: 145, incoming: 147 }` — bands matching either incoming OR snapshot are silent

#### Scenario: Method-derived table is silently replaced; method changes from formula to "train2go"

- **GIVEN** a profile with `cycling.powerZones = { method: "coggan-7", zones: calculatePowerZones("coggan-7") }` (Coggan formula derives bands like Z1: 0-55%, Z2: 56-75%, etc.)
- **AND** the persisted `cycling.thresholds.ftp = 200`
- **AND** T2G provides cycling power bands derived from `z4Upper = 268` (Z1: 41-56%, etc., relative to T2G's FTP)
- **WHEN** `syncZones` runs
- **THEN** the classifier SHALL return state `method-derived`
- **AND** the persisted `cycling.powerZones.zones` SHALL be replaced with T2G's 5 bands (5 entries, NOT 7)
- **AND** the persisted `cycling.powerZones.method` SHALL equal `"train2go"` (overwritten — original `"coggan-7"` is lost; user can re-pick from the dropdown later)
- **AND** the result's `conflicts` SHALL be empty for `cycling.powerZones.*`
- **AND** the FTP scalar SHALL surface as a conflict separately if persisted FTP (200) differs from T2G's z4Upper (268); the band write is independent of the FTP scalar decision (D-MA6 couples them at the dialog layer, not the reconcile layer)

### Requirement: `lastSyncedZonesSnapshot` persisted on each linked coaching account

The `LinkedCoachingAccount` schema SHALL include an optional `lastSyncedZonesSnapshot` field that captures the post-mapper Kaiord-domain zone arrays + threshold scalars from the most recent successful T2G sync. The snapshot's purpose is to enable the classifier to detect "user edited zones since the last sync" without per-zone tracking.

The snapshot shape:

```ts
type LastSyncedZonesSnapshot = {
  syncedAt: string; // ISO 8601 timestamp
  cyclingHr: HeartRateZone[]; // 5 entries
  runningHr: HeartRateZone[]; // 5 entries
  swimmingHr: HeartRateZone[]; // 5 entries
  cyclingPower: PowerZone[]; // 5 entries (T2G's count)
  runningPace: PaceZone[]; // 5 entries
  swimmingPace: PaceZone[]; // 5 entries
  bodyWeight?: number;
  maxHeartRate?: number;
  cyclingFtp?: number;
  cyclingLthr?: number;
  runningLthr?: number;
  runningThresholdPace?: number;
  swimmingCss?: number;
};
```

The snapshot SHALL be updated by `commitConflictResolution` (and by `syncZones` for silent-fill paths) to reflect the bands that were ACCEPTED. Rejected bands keep their pre-sync persisted values; the snapshot reflects the user's chosen state at the end of each sync.

#### Scenario: Snapshot is established on first successful sync

- **GIVEN** a freshly-linked T2G account with `linkedAccounts[0].lastSyncedZonesSnapshot = undefined`
- **AND** the user toggles `syncZones = true` and triggers the first sync
- **WHEN** `syncZones` completes successfully
- **THEN** `linkedAccounts[0].lastSyncedZonesSnapshot` SHALL be populated with the full zone arrays + threshold scalars from T2G
- **AND** `lastSyncedZonesSnapshot.syncedAt` SHALL equal the sync's wall-clock timestamp (ISO 8601)

#### Scenario: Snapshot reflects only accepted bands when conflicts are resolved

- **GIVEN** a profile with `cycling.heartRateZones = { method: "user", zones: [{Z1: 100-130}, ..., {Z5: 175-187}] }`
- **AND** T2G provides bands `[{Z1: 107-133}, ..., {Z5: 175-187}]`
- **AND** `syncZones` produces 8 per-band conflict entries (Z1.{minBpm,maxBpm} both differ; Z5.{minBpm,maxBpm} match — so Z5 has no conflicts)
- **AND** the user accepts Z1 (both bounds) and rejects Z2-Z4 in the conflict dialog
- **WHEN** `commitConflictResolution` is called
- **THEN** the persisted `cycling.heartRateZones.zones[0]` SHALL be `{minBpm: 107, maxBpm: 133}` (Z1 accepted)
- **AND** `zones[1..3]` SHALL stay at the pre-sync values (Z2-Z4 rejected)
- **AND** `linkedAccounts[0].lastSyncedZonesSnapshot.cyclingHr[0]` SHALL be `{minBpm: 107, maxBpm: 133}` (Z1 from T2G)
- **AND** `lastSyncedZonesSnapshot.cyclingHr[1..3]` SHALL be `{minBpm: 131, maxBpm: 145}` (Z2 user pre-sync), `{minBpm: 146, maxBpm: 160}` (Z3 user pre-sync), `{minBpm: 161, maxBpm: 170}` (Z4 user pre-sync) — the snapshot reflects what's PERSISTED, not what T2G said

### Requirement: ZoneEditor flips `method = "user"` on manual band edit

When the user edits any zone band's bound (e.g., `cycling.heartRateZones.zones[1].maxBpm`) via the Profile Manager `ZoneEditor`, the corresponding `<sport>.<kind>.method` SHALL be updated to `"user"` as part of the same persistence write. The dropdown's "Custom" selection still produces `method = "custom"` — the two values are now distinct semantic signals:

- `"custom"` → "user picked Custom in the dropdown; zones may be empty/seed/edited (classifier checks content)"
- `"user"` → "user has explicitly edited a band; reconcile MUST treat as user-customized"

#### Scenario: Manual edit to a single band flips method to "user"

- **GIVEN** a profile with `cycling.heartRateZones = { method: "train2go", zones: [...] }`
- **WHEN** the user edits `Z2.maxBpm` from `147` to `145` in the Profile Manager
- **AND** the ZoneEditor save handler runs
- **THEN** the persisted profile's `cycling.heartRateZones.method` SHALL equal `"user"`
- **AND** `cycling.heartRateZones.zones[1].maxBpm` SHALL equal `145`
- **AND** the other 4 bands' values SHALL be unchanged

#### Scenario: Method dropdown change does NOT flip to "user"

- **GIVEN** a profile with `cycling.heartRateZones = { method: "custom", zones: [all-zero seed] }`
- **WHEN** the user selects "Karvonen 5-zone" from the method dropdown
- **AND** the `useMethodSwitch` hook recomputes zones via `calculateHrZones(lthr, "karvonen-5")`
- **THEN** the persisted profile's `cycling.heartRateZones.method` SHALL equal `"karvonen-5"` (NOT `"user"` — dropdown selection is its own signal)
- **AND** the zones SHALL be the formula-derived values

### Requirement: Conflict dialog groups band-level conflicts by sport-kind table

The `ZonesConflictDialog` SHALL render conflicts in two structural tiers:

1. **Threshold scalars** (the legacy 7 keys: `cycling.thresholds.ftp`, `cycling.thresholds.lthr`, `running.thresholds.lthr`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `heartRate.max`, `bodyWeight`) — one row per scalar (existing per-row UI preserved).

2. **Band-level conflicts** — grouped by `<sport>.<kind>` table. Each group is a single decision unit:
   - Summary line: `"<Sport> <Kind> Zones — N bands differ"` (e.g., `"Cycling HR Zones — 5 bands differ"`)
   - Per-table radio: `[Accept Train2Go]` / `[Keep current]` (default = `Keep current`, matching the existing scalar default)
   - `[▼ Detail]` toggle that expands an inline list of per-band rows showing `current → incoming` for each disagreeing band, plus a `✓` marker for bands matching T2G

The decision unit emitted by the dialog is per-table: clicking `Accept Train2Go` on the group SHALL emit `accept` decisions for ALL bands of that table; clicking `Keep current` SHALL emit `reject` for all. The `commitConflictResolution` use case still receives a `Record<FieldKey, ConflictDecision>` map — the dialog just constructs it from per-table decisions.

#### Scenario: Five-band cycling HR conflict renders as a single group row

- **GIVEN** the conflicts array contains 10 entries for `cycling.heartRateZones.{z1..z5}.{minBpm,maxBpm}`
- **WHEN** the dialog renders
- **THEN** the dialog SHALL render exactly ONE group row labeled `"Cycling HR Zones"` with the summary `"5 bands differ"`
- **AND** the group row SHALL have a single accept/reject radio (NOT 10 radios)
- **AND** the testid `zones-conflict-group-cycling-heartRateZones` SHALL be present on the group row
- **AND** the per-band rows (testids `zones-conflict-row-cycling.heartRateZones.z1.minBpm`, etc.) SHALL exist in the DOM but be hidden until `[▼ Detail]` is clicked

#### Scenario: Accepting a group emits per-band accept decisions

- **GIVEN** the dialog has rendered a `cycling.heartRateZones` group with 4 conflicting band-bound entries
- **WHEN** the user clicks `Accept Train2Go` on the group row
- **AND** clicks `Apply`
- **THEN** `onConfirm` SHALL be called with a `decisions` map containing exactly 4 entries: each conflicting band-bound FieldKey mapped to `"accept"`
- **AND** non-conflicting bands of the same table SHALL NOT appear in the decisions map (they were already in agreement)

### Requirement: FTP scalar conflict couples with cycling power band conflicts

When `cycling.thresholds.ftp` is in the conflicts array AND any `cycling.powerZones.zN.{minPercent,maxPercent}` entries are also in conflicts, the dialog SHALL render them as a SINGLE coupled decision unit labeled `"Cycling threshold + zones"`. Accepting the coupled unit SHALL emit `accept` for both the FTP scalar and ALL cycling-power-band conflicts. Rejecting SHALL emit `reject` for both.

When the FTP scalar is in conflicts but cycling power bands are NOT (or vice versa), the dialog renders them as standalone entries (existing per-row scalar UI for FTP, group-row UI for power bands).

**Coupled-state UI invariant:** when the user expands `[▼ Detail]` on a coupled "Cycling threshold + zones" group, the per-band rows SHALL display `current → incoming` for transparency but SHALL NOT render accept/reject radio inputs. The only accept/reject affordance is at the group level. Per-band granularity inside a coupled group is structurally disallowed because partial accept produces persistent display inconsistency: power bands store `%FTP` and the persisted FTP is the rendering multiplier, so accepting Z2 without Z3 plus accepting FTP creates the same `%FTP-vs-watts` inconsistency this requirement prevents.

Standalone (non-coupled) cycling-power band groups MAY preserve per-band display rows in their Detail view, but per-band radios are NOT exposed there either — the data model still emits a single `accept` or `reject` decision per table per the band-level conflict policy. Per-band post-sync micro-edits go through the Profile Manager `ZoneEditor`, not the dialog.

#### Scenario: Coupled FTP + power-bands group emits both decisions atomically

- **GIVEN** conflicts include `{ field: "cycling.thresholds.ftp", current: 200, incoming: 268 }` AND 5 cycling power band conflicts (Z1-Z5, both bounds each)
- **WHEN** the dialog renders
- **THEN** there SHALL be exactly ONE coupled group labeled `"Cycling threshold + zones"` (NOT a separate FTP row + cycling-power group)
- **AND** the group row SHALL show the FTP value `200 W → 268 W` and the band-count summary `"5 bands change with new FTP"`
- **AND** clicking `Accept Train2Go` SHALL produce a decisions map containing `cycling.thresholds.ftp: "accept"` AND all 10 power-band-bound FieldKeys mapped to `"accept"`

#### Scenario: FTP scalar without power band conflicts renders standalone

- **GIVEN** conflicts include `{ field: "cycling.thresholds.ftp", current: 200, incoming: 268 }` AND NO cycling power band entries
- **WHEN** the dialog renders
- **THEN** the FTP conflict SHALL render as a standalone row (the existing per-row scalar UI), NOT a coupled group
- **AND** the testid `zones-conflict-row-cycling.thresholds.ftp` SHALL be present (existing test selector unchanged)
