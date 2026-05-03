---
"@kaiord/workout-spa-editor": minor
---

Add the SPA-side backend for Train2Go zones-sync (PR 2/3 of the `train2go-zones-sync` change).

- New `CoachingTransport.readZones` port on `application/coaching/coaching-transport-port.ts` (optional — Garmin-shaped transports leave it unset; `syncZones` short-circuits with `{ ok: false, reason: "unsupported" }`).
- Train2Go transport implements `readZones` via the new `read-details` bridge action; the wire fetch is routed through the shared `BRIDGE_QUEUE` so zones-sync, snapshot-push and any future queue consumer share a single per-bridge 60/h budget.
- New domain types in `types/coaching-zones.ts`: `FieldKey`, `WrittenField`, `ConflictItem`, `SyncZonesResult`, `ConflictDecision`, `ZonesPayload` (Zod-validated raw bridge shape).
- `BridgeCapability` Zod enum extended with `read:training-zones`. `LinkedCoachingAccount` gains `syncZones?: boolean` (optional → no Dexie schema bump).
- New application use cases in `application/coaching/`:
  - `syncZones(profileId, transport, repo)` — fetches the bridge payload, eagerly writes silent fills to the persisted profile, returns conflicts UNWRITTEN for the UI.
  - `commitConflictResolution(profileId, decisions, repo, transportPayload)` — phase-2; idempotent.
- FTP precedence (design D5): `payload.paces.cycling.z4Upper` wins; `z5Lower` fallback only when `z4Upper` is absent OR `=== 0` (semantically "not set" for a watt threshold).
- Per-sport LTHR via `payload.hrZones.<sport>.z4Upper`; swimming LTHR is intentionally NOT mapped (no consumer in Kaiord today).
- Profile schema gains `maxHeartRate?: number` so the `heartRate.max` `FieldKey` has a stable storage path.
- Toast/log copy lives at the top of `sync-zones.ts` as SCREAMING_SNAKE_CASE constants so the `check-no-pii-leakage.mjs` mechanical guard can prove the strings are static.
- Tests: 25 new unit tests (transport port shape, wire-fetch + queue counter contract, adapter envelope, 11 syncZones cases, 4 commitConflictResolution cases).

This PR ships the application + adapter layer with no UI; the toggle, conflict dialog and connect/sync fan-out land in PR 3.
