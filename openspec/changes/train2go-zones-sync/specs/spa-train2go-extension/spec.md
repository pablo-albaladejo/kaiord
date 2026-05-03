## ADDED Requirements

### Requirement: `CoachingTransport` exposes an optional `readZones` capability

The `CoachingTransport` port SHALL gain an optional method `readZones?: (externalUserId: string, signal?: AbortSignal) => Promise<ZonesPayload | null>`. The Train2Go transport adapter SHALL implement it; other adapters (Garmin) SHALL leave it unimplemented or return `null`. Application use cases that consume zones SHALL check for the method's presence before calling and SHALL gracefully degrade when absent (`{ ok: false, reason: "unsupported" }`).

#### Scenario: Train2Go transport implements readZones

- **GIVEN** a `Train2GoCoachingTransport` instance
- **WHEN** `transport.readZones` is checked
- **THEN** it SHALL be a function

#### Scenario: Garmin transport does not implement readZones

- **GIVEN** a `GarminCoachingTransport` instance (if/when one exists)
- **WHEN** the application's `syncZones` use case is called with that transport
- **THEN** the use case SHALL short-circuit with `{ ok: false, reason: "unsupported" }`
- **AND** SHALL NOT throw

### Requirement: `readZones` goes through the existing OperationQueue

The Train2Go transport's `readZones` implementation SHALL go through the existing `OperationQueue` from the bridge adapter package (`packages/workout-spa-editor/src/adapters/bridge/operation-queue.ts`), the same module used by `useProfileSnapshotPush`. Pre-existing `readWeek` / `readDay` calls bypass this queue today (separate spec drift not in this change's scope); `readZones` SHALL be the second consumer of the queue and SHALL respect the 60-ops-per-bridge-per-hour cap from the spa-bridge-protocol spec.

#### Scenario: 60th op succeeds

- **GIVEN** a bridge that has already executed 59 ops via the OperationQueue within the past hour
- **WHEN** the SPA invokes `readZones`
- **THEN** the call SHALL succeed (60th op, still within cap)

#### Scenario: 61st op is queued behind the cap

- **GIVEN** a bridge that has already executed 60 ops via the OperationQueue within the past hour
- **WHEN** the SPA invokes `readZones` (a 61st op)
- **THEN** the call SHALL be queued by `OperationQueue.enqueue` and SHALL NOT execute until the per-hour window slides forward enough to free a slot

#### Scenario: readWeek and readZones share a single per-bridge quota counter

- **GIVEN** a bridge that has already executed 59 `readWeek` ops via the OperationQueue within the past hour
- **WHEN** the SPA invokes `readZones`
- **THEN** the call SHALL succeed (60th op across the mixed action set, still within cap)
- **AND** any subsequent op (any action kind — readWeek, readDay, readZones) within the same hour SHALL be queued behind the cap, proving the counter is shared across action kinds, not per-action

### Requirement: `LinkedAccountRow` exposes the `Sync zones` toggle

The Profile Manager → Linked Accounts row for Train2Go SHALL include a checkbox or switch labelled `Sync zones from Train2Go`. The control SHALL be enabled only while the row is in the `linked` state. Toggling the control SHALL persist the new value to `profile.linkedAccounts[i].syncZones` via the existing persistence port. Toggling SHALL NOT trigger a sync by itself; the next link/sync action picks up the new value.

#### Scenario: Toggle is hidden for unlinked rows

- **GIVEN** the user has not yet linked Train2Go
- **WHEN** the user opens Profile Manager → Linked Accounts
- **THEN** the row's primary control SHALL be the existing `Connect Train2Go` button
- **AND** no `Sync zones` toggle SHALL be visible

#### Scenario: Toggling the switch persists immediately

- **GIVEN** a linked Train2Go account with `syncZones: false`
- **WHEN** the user clicks the `Sync zones` switch on
- **THEN** the persisted profile SHALL be updated with `linkedAccounts[i].syncZones: true`
- **AND** no zones-fetch network call SHALL fire as a side effect

### Requirement: Conflict dialog renders T2G strings safely

The `ZonesConflictDialog` component MUST NOT use `dangerouslySetInnerHTML`. Field labels SHALL be derived from a static SPA-side label map keyed by `FieldKey` (e.g., `{ "cycling.thresholds.ftp": "FTP" }`), NEVER from T2G strings. Numeric values SHALL be rendered as React children (text content), so React's default escaping applies. This prevents any XSS vector through T2G-controlled content even if upstream HTML changes.

#### Scenario: Dialog renders FTP without HTML escape

- **GIVEN** T2G returns `cycling.ftp = 270`
- **WHEN** the conflict dialog opens
- **THEN** the row label SHALL be `"FTP"` from the constant map (not from T2G)
- **AND** the value cell SHALL render `270` as text via React children

### Requirement: Train2Go connect callback fans out into a zones sync when toggle is on

`useConnectCallback` (in `adapters/train2go/use-train2go-actions.ts`) SHALL, after `attemptLink` resolves with `{ ok: true }`, check the just-persisted `linkedAccounts[i].syncZones` flag. If `true`, it SHALL call the application's `syncZones(profileId, transport)` use case. The connect promise SHALL still resolve to the link's outcome regardless of the zones-sync result; zones-sync errors SHALL surface as toasts/analytics, not as a thrown exception.

#### Scenario: Link succeeds with toggle on — sync fires

- **GIVEN** the user enables `Sync zones` and runs connect
- **WHEN** `attemptLink` resolves with `{ ok: true }`
- **THEN** the SPA SHALL call `syncZones(profileId, transport)` exactly once
- **AND** the connect callback SHALL resolve to the link result without rethrowing zones errors

#### Scenario: Link succeeds with toggle off — no sync

- **GIVEN** a fresh link with `syncZones: false`
- **WHEN** `attemptLink` resolves with `{ ok: true }`
- **THEN** the SPA SHALL NOT call `syncZones`

### Requirement: Train2Go sync callback fans out into a zones sync after the weekly read

`useSyncCallback` SHALL invoke the existing `weeklyRead` flow first; on its success AND when `linkedAccounts[i].syncZones` is `true`, the callback SHALL invoke `syncZones(profileId, transport)` once before resolving. A failure of the weekly read SHALL skip the zones sync (avoid stacking errors). A failure of zones-sync after a successful weekly read SHALL NOT mark the calendar sync as failed.

#### Scenario: Weekly read succeeds, zones sync fires

- **GIVEN** a linked account with `syncZones: true`
- **WHEN** the user clicks the calendar header sync button
- **THEN** the SPA SHALL execute the weekly read first
- **AND** then call `syncZones(profileId, transport)` once
- **AND** mark the calendar sync as succeeded regardless of the zones-sync outcome

#### Scenario: Weekly read fails — zones sync is skipped

- **GIVEN** a linked account with `syncZones: true`
- **WHEN** the weekly read returns an error
- **THEN** zones-sync SHALL NOT be invoked
- **AND** the user SHALL see the existing calendar-sync error UX

### Requirement: `bodyWeight` and `heartRate.max` are populated from the existing ping payload, not the zones endpoint

When zones-sync runs (toggle is on, link/sync trigger fired), the use case SHALL extract `bodyWeight` and `heartRate.max` from the `physiological` block of the parsed `/user/details` response. The `/profile/ping` payload's `data.user.weight` and `data.user.bpm_max` are NOT consulted by zones-sync — they remain an independent source used by the heartbeat / Profile Manager status display only.

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

## MODIFIED Requirements

### Requirement: Bridge capability schema extension

The `BridgeCapability` Zod enum (in `packages/workout-spa-editor/src/types/bridge-schemas.ts`) SHALL include both `read:training-plan` AND `read:training-zones`. (Both must be valid for `bridgeManifestSchema` to validate manifests advertising either capability.)

#### Scenario: New capability passes manifest validation

- **GIVEN** a bridge ping returns `capabilities: ["read:training-plan", "read:training-zones"]`
- **WHEN** the SPA validates the manifest via `bridgeManifestSchema`
- **THEN** validation SHALL succeed
