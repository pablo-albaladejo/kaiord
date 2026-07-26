## ADDED Requirements

### Requirement: Unified per-bridge connection state

The SPA SHALL maintain exactly one connection state per known bridge,
exposing `bridgeId`, `discovered`, `sessionActive`, `checking`, `error`,
`needsReauth`, `lastCheckedAt` and `lastSyncAt` through a single read model.
The bridge set SHALL be derived from the integration registry, and
`discovered` SHALL be true exactly when bridge discovery holds a verified
extension id for that bridge. A bridge that is not discovered SHALL NOT be
probed and SHALL report `sessionActive: false` with a `null` error.

#### Scenario: Every known bridge has a row

- **GIVEN** only the garmin-bridge extension is installed
- **WHEN** the connection read model is queried
- **THEN** it SHALL return one row per known bridge, with garmin-bridge marked `discovered: true` and every other bridge marked `discovered: false`

#### Scenario: Undiscovered bridges are never probed

- **GIVEN** the whoop-bridge extension is not installed
- **WHEN** a refresh pass runs
- **THEN** no message SHALL be sent for whoop-bridge and its row SHALL report `sessionActive: false`, `error: null` and `lastCheckedAt: null`

#### Scenario: A newly announced bridge is probed

- **GIVEN** a bridge previously reported `discovered: false`
- **WHEN** bridge discovery verifies its announcement
- **THEN** a session probe SHALL be issued for that bridge and its row SHALL be updated with the result

### Requirement: Session probes fold every failure into the state

Every bridge prober SHALL resolve — never reject — with
`{ sessionActive, error, needsReauth }`. A transport failure SHALL yield
`sessionActive: false` and MAY carry a diagnostic error message; a clean
not-signed-in response SHALL yield `sessionActive: false` with `error: null`.
An unsupported protocol version SHALL yield `sessionActive: false` with a
user-facing "Update your …" message; a dead upstream session SHALL carry the
bridge's own message and SHALL set `needsReauth` when the bridge reports it.
One unreachable bridge SHALL NOT abort the refresh pass for the others.

#### Scenario: Unreachable extension does not break the pass

- **GIVEN** garmin-bridge and whoop-bridge are both discovered
- **AND** the garmin-bridge extension does not answer its ping
- **WHEN** a refresh pass runs
- **THEN** garmin-bridge SHALL report `sessionActive: false` and whoop-bridge SHALL still be probed and updated

#### Scenario: Transport failure keeps its diagnostic message

- **GIVEN** whoop-bridge is discovered but its status read fails
- **WHEN** its session probe runs
- **THEN** the row SHALL report `sessionActive: false` and SHALL carry the bridge's failure message in `error`

#### Scenario: Clean signed-out answer carries no error

- **GIVEN** whoop-bridge answers its status read with no captured session
- **WHEN** its session probe runs
- **THEN** the row SHALL report `sessionActive: false` with `error: null`

#### Scenario: Expired cookie session asks for re-login

- **GIVEN** trainingpeaks-bridge is discovered and its trainingpeaks.com session has expired
- **WHEN** its session probe runs
- **THEN** the row SHALL report `sessionActive: false`, `needsReauth: true` and the bridge's own error message

### Requirement: Only cheaply-probeable bridges are polled

A bridge SHALL be probed only when its session action is cheap and
side-effect free. A discovered bridge with no registered prober SHALL be
reported as discovered with `sessionActive: false` and `error: null`, and
SHALL NOT be messaged. `tanita-bridge` SHALL NOT be probed while its
`checkSession` action is implemented as a full export-CSV download, because
polling it would re-download the user's entire history every pass.

#### Scenario: Tanita reports discovery only

- **GIVEN** the tanita-bridge extension is installed and verified
- **WHEN** a refresh pass runs
- **THEN** no message SHALL be sent to tanita-bridge and its row SHALL report `discovered: true`, `sessionActive: false`, `error: null` and `lastCheckedAt: null`

#### Scenario: Probe result for a vanished extension is discarded

- **GIVEN** a probe is in flight for a discovered bridge
- **WHEN** the extension is uninstalled or replaced before the probe resolves
- **THEN** the resolved result SHALL be discarded rather than written, and the row SHALL be re-derived from live discovery

### Requirement: Positive-only cache with 5-minute polling and throttled visibility refresh

The SPA SHALL re-probe every discovered bridge on a 5-minute interval and
SHALL force a re-probe when the document becomes visible, subject to a
minimum interval of 60 seconds since the last completed refresh so that
rapid tab switching cannot storm the bridges. A successful probe SHALL be
cached for 30 seconds; a failed or session-inactive probe SHALL NOT be
cached, so the next trigger always re-probes. A forced refresh SHALL bypass
the 30-second cache.

#### Scenario: Signing in elsewhere is noticed on return

- **GIVEN** a bridge last probed as `sessionActive: false` more than 60 seconds ago
- **AND** the user signs in to that platform in another tab
- **WHEN** the user returns to the SPA and the document becomes visible
- **THEN** a forced probe SHALL run and the row SHALL flip to `sessionActive: true`

#### Scenario: Rapid tab switching does not storm the bridges

- **GIVEN** a refresh completed 30 seconds ago
- **WHEN** the document becomes visible twice in quick succession
- **THEN** no probe SHALL be issued for either event

#### Scenario: Repeated reads inside the cache window do not re-probe

- **GIVEN** a bridge probed as `sessionActive: true` 15 seconds ago
- **WHEN** an unforced refresh runs
- **THEN** no message SHALL be sent for that bridge

### Requirement: Probes run outside the shared operation queue

Session probes SHALL NOT be enqueued on the shared per-bridge operation
queue and SHALL NOT count against the protocol's 60-operations-per-hour
budget. They SHALL use short timeouts so an unresponsive extension cannot
stall the refresh pass.

#### Scenario: A long data read does not delay a probe

- **GIVEN** a 30-second Train2Go week read is in flight on the shared queue
- **WHEN** a refresh pass runs
- **THEN** the train2go-bridge probe SHALL be issued immediately rather than queued behind the read

### Requirement: Connection state is in-memory only

Connection state SHALL live in memory for the lifetime of the tab and SHALL
NOT be written to Dexie, in keeping with the bridge persistence boundary.
The only persisted value the read model consumes is `lastSyncAt`, read from
the existing `coachingSyncState` rows that the importers already write.

#### Scenario: Reload derives state afresh

- **GIVEN** a bridge reported `sessionActive: true` before a page reload
- **WHEN** the SPA boots again
- **THEN** the row SHALL start as unprobed and SHALL only report a session after a fresh probe

#### Scenario: No Dexie store is added for connection state

- **WHEN** the bridge persistence-boundary guard runs
- **THEN** the connection store modules SHALL contain no Dexie import and no persist middleware

### Requirement: Last-sync freshness comes from the sync-source map

The SPA SHALL resolve each bridge's `coachingSyncState` storage key through
a single bridgeId → source map, which SHALL record that `train2go-bridge`
stores its rows under the historical `"train2go"` key, and SHALL fall back
to the bridge id for any unmapped bridge. Bridge importers that persist
records SHALL write a `coachingSyncState` row on a successful run and SHALL
NOT write one when the run is gated off or fails.

#### Scenario: Train2Go freshness reads the historical key

- **GIVEN** a `coachingSyncState` row stored under source `"train2go"`
- **WHEN** the read model resolves freshness for `train2go-bridge`
- **THEN** that row's `lastSyncedAt` SHALL be exposed as the bridge's `lastSyncAt`

#### Scenario: A gated-off import records no freshness

- **GIVEN** no enabled import route targets tanita-bridge
- **WHEN** the Tanita import runs
- **THEN** no `coachingSyncState` row SHALL be written
