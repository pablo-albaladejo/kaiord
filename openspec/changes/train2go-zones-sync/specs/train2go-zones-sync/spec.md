## ADDED Requirements

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

The `syncZones(profileId, transport, repo): Promise<SyncZonesResult>` use case SHALL reconcile each Train2Go threshold field against the persisted Kaiord profile under the following rules:

| Kaiord field state             | Action                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Empty / absent                 | Write the Train2Go value silently and include it in `applied` |
| Same value as Train2Go         | No-op                                                         |
| Different value (manual entry) | Include in `conflicts` (NOT written)                          |

The success result is `{ ok: true, applied: WrittenField[], conflicts: ConflictItem[] }`. Conflicting values MUST NOT be written to the profile by `syncZones` itself — they are returned to the caller (the UI) for presentation. Silent fills ARE written eagerly during `syncZones` execution.

#### Scenario: Triathlete profile gets per-sport LTHR (silent fills)

- **GIVEN** the parsed `/user/details` payload has `payload.hrZones.cycling.z4Upper = 160` (bpm) and `payload.hrZones.running.z4Upper = 168` (bpm)
- **AND** the user's profile has both `cycling.thresholds.lthr` and `running.thresholds.lthr` empty
- **WHEN** `syncZones` runs
- **THEN** the result SHALL be `{ ok: true, applied: [{cycling.thresholds.lthr: 160}, {running.thresholds.lthr: 168}], conflicts: [] }`
- **AND** `cycling.thresholds.lthr` SHALL be `160` after the call
- **AND** `running.thresholds.lthr` SHALL be `168` after the call
- **AND** swimming LTHR SHALL NOT be written (no consumer in Kaiord)

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

The `commitConflictResolution(profileId, decisions, repo, transportPayload): Promise<void>` use case SHALL accept a `decisions: Record<FieldKey, 'accept' | 'reject'>` map and apply per-row decisions: for each `accept`, write the T2G value from the original payload; for each `reject`, no-op. The function SHALL be idempotent — calling it twice with the same decisions produces the same final state. The SPA SHALL open a single confirmation dialog listing every conflicting field with both values (`Field: Kaiord-value → Train2Go-value`); the user SHALL be able to accept or reject each row independently. Cancelling the dialog SHALL discard only the conflicting writes; previously-committed silent fills (returned in `applied` from `syncZones`) SHALL remain.

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
