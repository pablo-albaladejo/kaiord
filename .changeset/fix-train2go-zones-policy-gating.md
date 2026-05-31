---
"@kaiord/workout-spa-editor": patch
---

Gate Train2Go zones auto-import on the IntegrationPolicy, not link presence.

Completes the syncZones → IntegrationPolicy migration that PR #705 left half-wired:

- `shouldFanOutZones` now requires an enabled auto-import `(training-zones, import, mode: auto)` policy in addition to a linked account, instead of firing on link presence alone.
- Adds the SPA-mount import lifecycle (`useZonesAutoImportOnMount` in `Train2GoZonesSyncProvider`) so a migrated profile auto-fetches zones once per mount when the policy is present (spec `spa-train2go-extension` §"Zone auto-import gated on IntegrationPolicy").
- Exposes `integrationPolicy` on `PersistencePort` (Dexie + in-memory adapters).
- Reconciles the `zones-sync` / `train2go-zones-via-policy` e2e specs to seed the policy, and updates the fan-out unit tests to the policy contract.
