> Completed: 2026-07-26

## Why

The `trainingpeaks-bridge` extension shipped in #1008 (session capture,
`read-metrics`/`push-weight` relay, 46 tests), but the SPA registry still
declares TrainingPeaks `not-supported` with `bridgeId: null`, so a user who
installs the extension gets nothing: the announce is dropped (not in
`KNOWN_BRIDGE_IDS`), no Data Hub column activates, and the Athlete page shows
"Not supported yet". A test even pins the wrong state.

Separately, Tanita announces `read:body`, so the Data Hub renders toggleable
import cells for five data types — but no Tanita import path exists at all
(the only Tanita code is the Tanita→Garmin FIT export). Toggling those cells
persists a policy that imports nothing. The same shared-token over-claiming
makes phantom cells inevitable for any bridge whose capability token spans
more data types than its SPA importer supports.

Finally, the profile-snapshot push targets every discovered bridge, but only
garmin/train2go handle the action — pushes to the other three are rejected by
their envelopes and burn 3 rate-limit slots per bridge per hour.

## What Changes

- Promote TrainingPeaks in `INTEGRATION_REGISTRY` to `mechanism: "bridge"`,
  `bridgeId: "trainingpeaks-bridge"`, making it discoverable, verifiable and
  routable like the other four bridges.
- Add a TrainingPeaks SPA transport (`checkSession`, `read-metrics`) and a
  policy-gated weight import (30-day window) persisting through the shared
  inbound natural-key upsert with `sourceBridgeId: "trainingpeaks-bridge"`.
- Add a real Tanita import for weight and body composition from the bridge's
  `read-export-csv`, extracting per health extension (one CSV row can carry
  BOTH weight and body composition) and deduping via
  `canonicalHash({dataType, measuredAt})` external ids.
- Add a supported-route filter so a bridge whose shared capability token
  over-claims (e.g. `read:body`) only surfaces Data Hub cells and policy
  eligibility for data types its SPA importer actually persists
  (tanita: weight + body-composition; trainingpeaks: weight). Bridges without
  an entry are unrestricted.
- Gate the profile-snapshot push to snapshot-capable bridges
  (garmin/train2go), with a parity test against
  `scripts/sync-bridge-core.mjs` `SNAPSHOT_BRIDGES`.
- Health source badges for `tanita-bridge` and `trainingpeaks-bridge`.

Out of scope (later waves): TrainingPeaks weight export (`push-weight`),
narrowing WHOOP's `read:body` phantom routes, unified bridge session model,
the unified Connections page.

## Capabilities

### New Capabilities

- `spa-trainingpeaks-extension`: SPA-side TrainingPeaks bridge integration —
  discovery, session gate, policy-gated weight import.
- `spa-tanita-extension`: SPA-side Tanita bridge import — policy-gated weight
  and body-composition import from the MyTANITA CSV export.

### Modified Capabilities

- `spa-integration-adapters`: supported-route filtering for shared capability
  tokens; profile-snapshot push restricted to snapshot-capable bridges.
