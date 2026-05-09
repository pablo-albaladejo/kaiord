---
"@kaiord/garmin": minor
---

Add multisport transition support to Garmin GCN adapter.

The Garmin workout input schema now accepts an optional `isSessionTransitionEnabled: boolean` flag at the workout root, used by Garmin Connect to enable automatic transitions between segments of different sports in multisport workouts (triathlon, brick, duathlon).

The flag round-trips through the adapter via `krd.extensions.gcn.isSessionTransitionEnabled`, so reading a multisport GCN and re-writing it preserves the transition behavior.

Range targets (`pace.zone`, `power.zone`) are now emitted with the faster / higher-intensity bound in `targetValueOne` and the slower / lower-intensity bound in `targetValueTwo`, matching how Garmin Connect's server stores them. The reader normalizes incoming targets to `[min, max]` regardless of source order, so range semantics survive round-trip even when source data uses the opposite ordering.
