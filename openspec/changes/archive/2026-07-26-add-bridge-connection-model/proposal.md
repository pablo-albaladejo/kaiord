> Completed: 2026-07-26

## Why

Five bridges ship today and each answers "am I connected?" its own way. Garmin
keeps session state in a React context fed by `garmin-bridge-operations`;
Train2Go keeps it in a Zustand store with its own 30-second positive cache;
WHOOP, TrainingPeaks and Tanita have no session state at all — their UI infers
"connected" from discovery alone, so an installed extension with a dead cookie
session reads as healthy. Adding a sixth bridge means inventing a sixth model.

The `spa-bridge-protocol` spec still describes a heartbeat state machine that
was never built: 60-second pings, UNAVAILABLE after 3 consecutive misses,
REMOVED after 24 hours, and a `lastSeen` timestamp written to syncState. No
part of it exists in code, and the `lastSeen` write would violate the
persistence boundary that the bridge runtime-store guard enforces.

Freshness is equally scattered: the Data Hub matrix hardcodes a
`train2go ? … : garmin ? … : undefined` ternary, so the three newer bridges can
never show a "last synced" timestamp — and the two newest importers (Tanita,
TrainingPeaks) never write a `coachingSyncState` row in the first place.

## What Changes

- Add an in-memory `bridgeConnections` store holding one
  `BridgeConnectionRuntime` per known bridge: `discovered`, `sessionActive`,
  `checking`, `error`, `needsReauth`, `lastCheckedAt`.
- Add `SESSION_PROBES`, one non-throwing prober per cheaply-probeable bridge,
  reusing each bridge's existing action (`ping` for garmin/train2go, `status`
  for WHOOP, `checkSession` for TrainingPeaks). `tanita-bridge` is excluded:
  its `checkSession` downloads the whole export CSV, so it reports discovery
  only until the extension grows a lightweight session action.
- Refresh on a 5-minute interval, on every discovery announcement, and forced
  when the document becomes visible (throttled to once per 60 seconds), with a
  30-second POSITIVE-only cache copied from `train2go-detect` (a negative
  result must never be cached).
- Discard a probe result whose extension vanished or was swapped while the
  probe was in flight, so a stale answer cannot resurrect a dead bridge.
- Run probes outside the shared `BRIDGE_QUEUE` so status checks neither queue
  behind 30-second reads nor consume the 60-operations-per-hour budget.
- Expose `useBridgeConnections(profileId)`, merging the runtime rows with
  `lastSyncAt` read through ONE `useLiveQuery` of N `coachingSyncState`
  point-gets.
- Add `BRIDGE_SYNC_SOURCES` (bridgeId → `coachingSyncState.source`, carrying
  the historical `train2go-bridge → "train2go"` exception) and one shared
  `readBridgeSyncStates` reader driving the Data Hub matrix, the chat
  `get_data_routes` tool and the connection model alike.
- Write a `coachingSyncState` row after a successful Tanita or TrainingPeaks
  import, through a REQUIRED dep so no call site can silently skip it.
- Rewrite the unimplemented heartbeat requirement to match the shipped model.

The store ships **unmounted**: `useBridgeConnectionsBootstrap` exists and is
tested, but polling with no consumer is pure cost, so the wave that ships the
first connections UI mounts it.

Out of scope (later waves): migrating StatusIndicators, ExtensionsTab and
AthleteConnections onto the new hook; retiring the Garmin context and the
Train2Go detection store; any connect/disconnect action; a cheap tanita
session action (see design.md "Follow-up").

## Capabilities

### New Capabilities

- `spa-bridge-connection-model`: unified in-memory per-bridge connection
  state, its refresh policy, and the read model consumers subscribe to.

### Modified Capabilities

- `spa-bridge-protocol`: the bridge lifecycle requirement now describes the
  implemented 5-minute + visibility refresh model instead of the never-built
  heartbeat/UNAVAILABLE/REMOVED state machine.
