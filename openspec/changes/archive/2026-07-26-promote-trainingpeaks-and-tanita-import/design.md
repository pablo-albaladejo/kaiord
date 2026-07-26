# Design

## Decision 1 — supported-route filter, two chokepoints, opt-in restriction

Capability tokens are shared: `read:body` is the import token for weight,
hrv, daily-wellness, body-composition and stress. A bridge announcing it
becomes eligible for all five, regardless of what its SPA importer persists.
Narrowing the tokens themselves would fan out across bridge manifests, the
`bridgeCapabilitySchema` enum, discovery verification and the parity guards —
out of proportion for this wave.

Instead a small SPA-side map (`bridge-supported-routes.ts`) declares, per
bridge and direction, the data types its importer/exporter actually handles.
`bridgeSupportsRoute` defaults to `true` for bridges without an entry, so
precise-token bridges (garmin, train2go) and the not-yet-audited WHOOP are
untouched. It is applied at the two derivation points only:

- `eligibleBridgeIds` (policy/source-priority eligibility), and
- `cellState` via a new REQUIRED `supportsRoute` signal (returns `"na"`,
  which the Data Hub renders as an empty cell — phantom cells disappear).

The signal is REQUIRED so the compiler enumerates every signals construction
site — an optional field let the chat data-routes tool
(`hooks/chat/build-data-route-signals.ts`) silently bypass the filter, which
review caught. The check also runs BEFORE the `isBridgeOnline` test: support
is a static property of the bridge, not of its session, so an unsupported
route reads `"na"` even while the extension is offline.

WHOOP's own phantom routes (weight/body-composition/
daily-wellness via `read:body`) are intentionally left as-is for a later
wave; the map makes fixing them a one-line change.

## Decision 2 — Tanita import extracts per health extension, not per KRD type

`tanitaCsvToKrd` emits one KRD per CSV row with a single `type` but
potentially BOTH `extensions.health.weight` and
`extensions.health.bodyComposition`. Dispatching on `krd.type` (the
`import-health-dispatch` pattern) would silently drop the weight record for
every row that has composition columns. The import therefore walks the
health extensions directly and emits up to two pending records per row,
each independently gated by its own import policy flag.

External ids reuse the export path's precedent:
`canonicalHash({ dataType, measuredAt })`, giving stable
`(sourceBridgeId, externalId)` dedup across re-runs without content hashing.

## Decision 3 — parse functions injected, adapter packages lazy-loaded

`@kaiord/tanita` and `@kaiord/trainingpeaks` are only needed when a sync
actually runs. The use cases take `parse: (raw) => KRD[]` as a dep and the
hooks lazy-`import()` the converter (the `use-tanita-garmin-sync` precedent),
keeping both packages out of the main chunk and the application layer free
of adapter imports.

## Decision 4 — snapshot gating by allowlist + mechanical parity

There is no capability token for "accepts profile snapshots", and adding one
would widen a closed enum plus every parity guard. The push hook filters to
`SNAPSHOT_CAPABLE_BRIDGE_IDS` (garmin, train2go — the set for which
`scripts/sync-bridge-core.mjs` vendors `profile-snapshot.js`, per
`openspec/specs/bridge-core/spec.md`). The drifting-list risk is neutralised
by a test that parses `SNAPSHOT_BRIDGES` out of `sync-bridge-core.mjs` and
asserts equality, so vendoring a snapshot handler into a new bridge without
updating the SPA allowlist fails the suite.

## Decision 5 — TrainingPeaks import is weight-only, window-bounded

`@kaiord/trainingpeaks` maps only the weight metric today (pulse/hrv/sleep/
spo2 are deferred in the schema), and the bridge relays only
`consolidatedtimedmetrics` GETs. The import fetches a single 30-day window
(date-segment path params), converts via `trainingPeaksMetricsToKrd`, and
persists `weight` records only. `push-weight` (export) stays out of scope
until the managed-data registry grows a weight export token.
