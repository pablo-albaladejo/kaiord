## MODIFIED Requirements

### Requirement: `syncZones` returns conflicts unwritten, silent fills are committed eagerly

The `syncZones(profileId, transport, persistence): Promise<SyncZonesResult>` use case SHALL reconcile each Train2Go field against the persisted Kaiord profile under the following rules:

| Kaiord field state             | Action                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Empty / absent                 | Write the Train2Go value silently and include it in `applied` |
| Same value as Train2Go         | No-op                                                         |
| Different value (manual entry) | Include in `conflicts` (NOT written)                          |

Reconciliation operates at TWO granularities: (a) **threshold scalars** (`cycling.thresholds.ftp`, etc.) — one FieldKey per scalar, identical to the original change; (b) **zone bands** (`cycling.heartRateZones.z2.maxBpm`, etc.) — one FieldKey per band-bound, where each Z1-Z5 of each sport-kind table can independently land in `applied` or `conflicts`.

The success result is `{ ok: true, applied: WrittenField[], conflicts: ConflictItem[] }`. Each conflict carries Train2Go's value (`incoming`), so taking Train2Go's numbers needs no second read of Train2Go. Only zones and thresholds are ever conflicts: Train2Go's weight is never one (see "Train2Go's weight is a Train2Go weigh-in read by the Authority rule"). Conflicting values MUST NOT be written to the profile by `syncZones` itself — they are returned to the caller (the UI) for presentation. Silent fills ARE written eagerly during `syncZones` execution. `syncZones` SHALL re-read the profile inside the transaction that writes the fills, so an edit saved while Train2Go was being read is kept, not overwritten by the profile read before the fetch.

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
- **AND** while the athlete keeps their own FTP (they never use "Use Train2Go's"), the power bands SHALL still be persisted as %FTP relative to T2G's 268 (the bands were silent-filled by `syncZones`, per the per-band conflict policy below)

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
- **AND** the FTP scalar SHALL surface as a conflict separately if persisted FTP (200) differs from T2G's z4Upper (268); the band write is independent of the FTP scalar ("Use Train2Go's" takes every differing field together, not the reconcile layer)

## ADDED Requirements

### Requirement: Train2Go's different zones and thresholds are kept and offered, never asked

The SPA SHALL NOT ask which value decides. Where `syncZones` returns conflicts, the athlete's own zones and thresholds SHALL stay and nothing SHALL be committed until the athlete acts; the silent fills `syncZones` committed SHALL remain whatever the athlete does. The comparison SHALL cover only the numbers the athlete sets on the Athlete page: thresholds (FTP, LTHR, threshold pace, CSS, maximum heart rate) and zone bands; weight SHALL never be compared, offered or called the athlete's in it. Once per set of differing values (a per-device memo, per athlete) the SPA SHALL show one notice naming exactly what differs, in English and Spanish: "Train2Go has different thresholds from the ones you set. Kaiord kept yours.", or "zones", or "zones and thresholds", with one action, "Use Train2Go's". The offer SHALL stay open on that device after the notice is gone: the Athlete page SHALL show it, with "Use Train2Go's" and "Keep mine", for as long as a number in it still differs, until the athlete uses it or keeps theirs. A set Train2Go no longer differs on SHALL be forgotten, so a later difference is offered again. Using the action SHALL commit exactly the zones and thresholds that still differ (see "`commitConflictResolution` writes Train2Go's number for every differing zone and threshold") and SHALL say what changed: "Kaiord now uses Train2Go's thresholds." (or zones, or zones and thresholds).

#### Scenario: A different FTP is kept and offered once, naming the thresholds

- **GIVEN** the athlete set `cycling.thresholds.ftp = 200` and Train2Go reports 268
- **WHEN** the zones sync runs
- **THEN** no dialog SHALL open and the FTP SHALL stay 200
- **AND** one notice SHALL say "Train2Go has different thresholds from the ones you set. Kaiord kept yours." with "Use Train2Go's"

#### Scenario: The athlete lets the notice go

- **GIVEN** the athlete has no current weight, `cycling.thresholds.ftp = 200` and `running.thresholds.lthr = 150`
- **AND** `syncZones` recorded Train2Go's weight of 72 kg as its weigh-in and returned two conflicts (FTP 200→270, LTHR 150→168)
- **WHEN** the notice closes without its action being used
- **THEN** the Train2Go weigh-in of 72 kg SHALL remain
- **AND** `cycling.thresholds.ftp` SHALL stay at 200 and `running.thresholds.lthr` at 150
- **AND** the Athlete page SHALL still offer "Use Train2Go's" on that device, after a reload

#### Scenario: Using the offer changes exactly what it says, and says so

- **GIVEN** `syncZones` returned conflicts for FTP and the cycling power bands
- **WHEN** the athlete uses "Use Train2Go's", on the notice or on the Athlete page
- **THEN** `commitConflictResolution` SHALL be called with every one of those conflicts
- **AND** FTP SHALL be Train2Go's and the cycling power bands Train2Go's, with `method = "train2go"`
- **AND** a notice SHALL say "Kaiord now uses Train2Go's zones and thresholds."
- **AND** the offer SHALL be closed

#### Scenario: Keeping mine closes the offer

- **GIVEN** an open offer on the Athlete page
- **WHEN** the athlete uses "Keep mine"
- **THEN** nothing SHALL be written and the offer SHALL be closed
- **AND** a later sync with the same differing values SHALL offer nothing

#### Scenario: The same differing values are offered once

- **GIVEN** the notice was shown for a set of differing values
- **WHEN** a later sync returns the same set
- **THEN** no notice SHALL be shown again

#### Scenario: A number that no longer differs is not offered

- **GIVEN** an open offer for FTP 200 → 268
- **WHEN** the athlete sets their FTP to 268 themselves
- **THEN** the Athlete page SHALL show no offer

#### Scenario: Weight is never part of the notice

- **GIVEN** the athlete weighed 75 kg by hand today and Train2Go reports 83 kg
- **WHEN** the zones sync runs
- **THEN** no conflict SHALL be returned for `bodyWeight` and the notice, if any, SHALL name only zones or thresholds

### Requirement: `commitConflictResolution` writes Train2Go's number for every differing zone and threshold

The `commitConflictResolution(profileId, conflicts, persistence): Promise<void>` use case SHALL write each given conflict's Train2Go value (`incoming`), the one action "Use Train2Go's"; it SHALL take no per-field decision and SHALL have no path that rejects a field. Threshold scalars (FieldKeys ending in `.thresholds.<name>`, plus `heartRate.max`) SHALL be written to the profile. Band-level FieldKeys (`<sport>.<kind>.z<N>.<bound>`) SHALL be grouped by `<sport>.<kind>`; each table given a band SHALL take Train2Go's value for that band, `method := "train2go"`, and its `lastSyncedZonesSnapshot` slice SHALL become the post-write zones, so the next sync reads it as `train2go-synced-clean`. A field it is not given SHALL stay untouched. It SHALL NOT record a weigh-in or write `profile.bodyWeight`, and a `bodyWeight` item SHALL be ignored. It SHALL be idempotent, and SHALL throw `ProfileNotFoundError` when the profile is gone.

#### Scenario: Every differing threshold is taken

- **GIVEN** the profile has `cycling.thresholds.ftp = 200` and `running.thresholds.lthr = 150`
- **AND** the conflicts are FTP (200 → 270) and LTHR (150 → 168)
- **WHEN** `commitConflictResolution` is called with both
- **THEN** the profile's FTP SHALL be 270 and its running LTHR 168

#### Scenario: A field it is not given stays

- **GIVEN** the same profile
- **WHEN** `commitConflictResolution` is called twice with the LTHR conflict only
- **THEN** the FTP SHALL stay 200 and the running LTHR SHALL be 168
- **AND** the second call SHALL produce no additional side effects

#### Scenario: Every differing band of a table is taken

- **GIVEN** `cycling.heartRateZones = { method: "user", zones: [Z1 100-130, Z2 131-145, Z3 146-160, Z4 161-170, Z5 171-187] }` and Train2Go's bands `[107-133, 134-147, 148-160, 161-174, 175-187]`
- **WHEN** `commitConflictResolution` is called with every conflict `syncZones` returned for that table
- **THEN** the persisted zones SHALL be `[107-133, 134-147, 148-160, 161-174, 175-187]` with `method = "train2go"`
- **AND** `lastSyncedZonesSnapshot.cyclingHr` SHALL equal them
- **AND** the next `syncZones` with the same Train2Go data SHALL return no conflicts

### Requirement: The last synced zones are kept on each linked coaching account

The `LinkedCoachingAccount` schema SHALL include an optional `lastSyncedZonesSnapshot` field that captures the post-mapper Kaiord-domain zone arrays from the most recent successful T2G sync, so the classifier can detect "the athlete edited zones since the last sync" without per-zone tracking (shape: `syncedAt`, `cyclingHr`, `runningHr`, `swimmingHr`, `cyclingPower`, `runningPace`, `swimmingPace`, and the optional scalars `bodyWeight`, `maxHeartRate`, `cyclingFtp`, `cyclingLthr`, `runningLthr`, `runningThresholdPace`, `swimmingCss`). The snapshot SHALL be updated by `syncZones` for each table it silent-replaced and by `commitConflictResolution` for each table it took Train2Go's bands for, to the zones then persisted; a table the athlete kept SHALL keep its slice.

#### Scenario: The snapshot is established on the first successful sync

- **GIVEN** a freshly linked Train2Go account with no `lastSyncedZonesSnapshot`
- **WHEN** the first `syncZones` completes successfully
- **THEN** `lastSyncedZonesSnapshot` SHALL hold the zones it wrote, with `syncedAt` the sync's wall-clock time (ISO 8601)

#### Scenario: A kept table keeps its slice

- **GIVEN** a user-customized cycling HR table that differs from Train2Go's
- **WHEN** `syncZones` runs and the athlete never uses "Use Train2Go's"
- **THEN** `lastSyncedZonesSnapshot.cyclingHr` SHALL stay at its value before the sync

### Requirement: Per-band conflicts only for tables the athlete set

The `syncZones` use case SHALL detect band-level conflicts independently for each Z-band of each `<sport>.{heartRateZones, powerZones, paceZones}` table — but ONLY when the table's classified state (per the Zone-table customization states requirement) is `user-customized` OR `train2go-synced-edited`. Tables in `empty`, `default-template`, `method-derived`, OR `train2go-synced-clean` states SHALL be silent-replaced from T2G without emitting any conflict rows.

For tables that DO produce conflicts, the existing equality semantics apply: HR bpm integer equality, power percent integer equality (after `Math.round((watts/z4Upper)*100)`), pace seconds integer equality. Round-trip stability across re-syncs is preserved.

"Use Train2Go's" writes every differing band of a table together (see "`commitConflictResolution` writes Train2Go's number for every differing zone and threshold"); no table is ever left half-taken by a rejection.

#### Scenario: A fresh profile's first sync offers nothing

- **GIVEN** a profile created via `createNewProfile(...)` with `cycling.heartRateZones = { method: "custom", zones: DEFAULT_HEART_RATE_ZONES }` (5 entries, all-zero) AND `cycling.powerZones = { method: "coggan-7", zones: calculatePowerZones("coggan-7") }` (7 Coggan-default entries)
- **AND** the T2G payload provides full Z1-Z5 bands for cycling HR (Generic) + cycling power (watts) + running/swimming HR (Generic) + running/swimming pace
- **WHEN** `syncZones` runs
- **THEN** the result's `conflicts` SHALL be empty (zero rows for any sport-kind band table)
- **AND** the result's `applied` SHALL contain entries for every band the classifier silent-filled (5 sports-kinds × ~10 entries each = ~50 applied)
- **AND** all silent-filled tables SHALL have `method = "train2go"` post-sync
- **AND** the linked account's `lastSyncedZonesSnapshot` SHALL be fully populated

### Requirement: Train2Go's weight is a Train2Go weigh-in read by the Authority rule

The zones sync SHALL store Train2Go's `physiological.weight` as a weigh-in for today stamped `sourceBridgeId: "train2go-bridge"` (the Train2Go bridge id, like every other bridge's health rows), never as `"manual"` and never as `profile.bodyWeight`, and SHALL NOT return it as a conflict or offer it: it is a number Train2Go relays, not one the athlete set. Which weigh-in a day reads SHALL be the Authority rule's (`spa-authority`, "Kaiord picks the Authority by itself": the athlete's own entry, then Tanita, TrainingPeaks, Train2Go), for the Day and for the current weight alike (`energy-expenditure`, "One current body weight, read by the Authority"), so a Train2Go weigh-in recorded after the athlete's own entry or a scale reading of the same day SHALL NOT become what that day reads. Sources SHALL NOT overwrite each other's rows: a same-day write SHALL update only Train2Go's own weigh-in of that day; another source's weigh-in SHALL stay untouched. A weight equal to Train2Go's own latest weigh-in, or to the current weight, SHALL record nothing. The weigh-in SHALL be governed by the `weight · import · train2go-bridge` integration policy: with that route switched off the sync SHALL record nothing; with no such route (an extension that does not announce `read:body`, or a link made before it did) it SHALL record as if the route were on. Under a stored priority choice the Train2Go weigh-in SHALL be ranked like any other source. Neither `syncZones` nor `commitConflictResolution` SHALL write `profile.bodyWeight`.

#### Scenario: An unknown weight is recorded as Train2Go's weigh-in

- **GIVEN** the athlete has no weigh-in and no `profile.bodyWeight`
- **AND** Train2Go reports `physiological.weight = 83`
- **WHEN** `syncZones` runs
- **THEN** `applied` SHALL contain `{ field: "bodyWeight", value: 83 }`
- **AND** one weigh-in of 83 kg dated today, stamped `train2go-bridge`, SHALL exist
- **AND** `profile.bodyWeight` SHALL stay unset

#### Scenario: A different weight is recorded, never offered

- **GIVEN** the athlete's current weight is 75 kg (an earlier weigh-in, or `profile.bodyWeight`) and Train2Go reports 83
- **WHEN** `syncZones` runs
- **THEN** `conflicts` SHALL contain no `bodyWeight` entry
- **AND** one `train2go-bridge` weigh-in of 83 kg dated today SHALL exist

#### Scenario: The athlete's own weigh-in of today stays what today reads

- **GIVEN** the athlete weighed 75 kg by hand this morning and Train2Go reports 83
- **WHEN** `syncZones` runs later the same day
- **THEN** the manual weigh-in of 75 kg SHALL be unchanged, a `train2go-bridge` weigh-in of 83 kg SHALL exist beside it
- **AND** the current weight and the Day SHALL read 75 kg

#### Scenario: The scale outranks Train2Go on the same day

- **GIVEN** a Tanita weigh-in of 70.4 kg this morning and a `train2go-bridge` weigh-in of 83 kg recorded later
- **WHEN** the current weight is read
- **THEN** it SHALL be 70.4 kg

#### Scenario: Re-syncing the same weight records nothing

- **GIVEN** a previous sync recorded Train2Go's weigh-in of 83 kg
- **WHEN** `syncZones` runs again and Train2Go still reports 83, even with another source's weigh-in since
- **THEN** `applied` and `conflicts` SHALL be empty and no weigh-in SHALL be added

#### Scenario: A changed Train2Go weight updates its own weigh-in of the day

- **GIVEN** today's `train2go-bridge` weigh-in is 75 kg
- **WHEN** `syncZones` runs and Train2Go reports 83
- **THEN** that same row SHALL hold 83 kg and no other weigh-in SHALL be added

#### Scenario: The current weight already reads Train2Go's weight

- **GIVEN** `profile.bodyWeight = 80` and the current weigh-in is 83 kg
- **WHEN** `syncZones` runs and Train2Go reports 83
- **THEN** nothing SHALL be recorded

#### Scenario: A weight route switched off withholds the weight

- **GIVEN** the athlete's `weight · import · train2go-bridge` route exists and is disabled
- **WHEN** `syncZones` runs and Train2Go reports 83
- **THEN** no `train2go-bridge` weigh-in SHALL be recorded and `applied` SHALL contain no `bodyWeight` entry

#### Scenario: No weight route keeps the weight flowing

- **GIVEN** the athlete has no `weight · import · train2go-bridge` route
- **AND** the athlete has no current weight and Train2Go reports 83
- **WHEN** `syncZones` runs
- **THEN** one `train2go-bridge` weigh-in of 83 kg dated today SHALL exist

## REMOVED Requirements

### Requirement: `commitConflictResolution` applies user decisions

**Reason**: It applied a per-row accept / reject decision from a dialog that no longer exists (#1666, ADR 0003 "decide and offer undo"), and nothing in the App can reject a field: the one action takes every differing value. Its scenarios named a dialog the athlete cancels and an FTP the athlete rejects, neither of which can happen.

**Migration**: see "`commitConflictResolution` writes Train2Go's number for every differing zone and threshold" and "Train2Go's different zones and thresholds are kept and offered, never asked". The function now takes the conflicts to write instead of a decision map and the Train2Go payload.

### Requirement: Per-band conflict policy with full-array commit on accept

**Reason**: Its commit half merged accepted and rejected bands of a table and marked a half-taken table `method = "user"`; with no rejection, a table is taken whole or kept.

**Migration**: the detection half is kept unchanged as "Per-band conflicts only for tables the athlete set"; the commit half is "`commitConflictResolution` writes Train2Go's number for every differing zone and threshold".

### Requirement: `lastSyncedZonesSnapshot` persisted on each linked coaching account

**Reason**: It described a snapshot holding a mix of accepted and rejected bands chosen in the conflict dialog.

**Migration**: "The last synced zones are kept on each linked coaching account".

### Requirement: Train2Go's weight is the athlete's current weight

**Reason**: It compared Train2Go's weight with the current weight and offered it as the athlete's own number, so a weight from Tanita was called "yours", every new weigh-in raised the notice again, and "Use Train2Go's" wrote a weigh-in the scale outranks, so the Day could show no change. Weight is a kind with an Authority, not a number the athlete sets.

**Migration**: "Train2Go's weight is a Train2Go weigh-in read by the Authority rule".

### Requirement: Conflict dialog groups band-level conflicts by sport-kind table

**Reason**: The conflict dialog asked the athlete which value decides on every sync with a difference (#1666, ADR 0003 "decide and offer undo"). It is removed: the athlete's own values win, and one notice offers Train2Go's instead.

**Migration**: see "Train2Go's different zones and thresholds are kept and offered, never asked" and `spa-authority`, "Nothing asks which Platform decides".

### Requirement: FTP scalar conflict couples with cycling power band conflicts

**Reason**: The coupling existed so the dialog could not accept FTP without its power bands. The one action left takes every differing field together, so FTP and its bands can no longer be split.

**Migration**: none; "Use Train2Go's" takes FTP and the cycling power bands as one.
