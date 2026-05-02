---
"@kaiord/workout-spa-editor": patch
"@kaiord/garmin-bridge": minor
"@kaiord/train2go-bridge": minor
---

Bridge popup trigger wiring + lastPushReceipt + dead-code sweep.

SPA: `useProfileSnapshotPush` (mounted in `App`) now reads the discovered bridges from the in-memory `bridgeDiscovery` singleton (the actual source of truth) instead of an empty Dexie table that no other code wrote to. The hook drives a shared `OperationQueue` that enforces the 60/h-per-bridge cap from the SPA Bridge Protocol spec, and parks a `pendingClear` flag when the active profile is deleted while no bridges are reachable so `profile-snapshot-clear` still fires the next tick a bridge appears. The previously-unused `dexie-bridge-repository`, `bridge-registry`/`-helpers`/`-prune`, `push-active-profile`, and `snapshot-pusher` modules are removed; the in-memory singleton is the only registry.

Bridges (Garmin + Train2Go): `persistSnapshot` now writes `lastPushReceipt: { at, name }` to `chrome.storage.local` atomically with the snapshot, and `clearSnapshot` removes it alongside `profileSnapshot` and `lastWeeklyRollup`. The Garmin popup's "Last push · N min ago — <name>" line now actually renders; before, the writer side was never wired and the popup silently fell back to omitting the line.
