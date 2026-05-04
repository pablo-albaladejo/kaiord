---
"@kaiord/workout-spa-editor": patch
---

E2E coverage for zone-method-aware reconcile (PR 5 of 6 of `zones-method-aware-reconcile`).

- Extended `FIXTURE_ZONES_PAYLOAD` in `e2e/helpers/train2go-bridge-stub.ts` with full Z1-Z5 bands per block (HR Generic + cycling power watts + running/swimming pace `{min,sec}`) so the new payload shape is exercised end-to-end. Also added `physiological.bpmRest` (allowlisted but not persisted per D-FB8).
- Added new flow (d) in `e2e/zones-sync.spec.ts`: FTP scalar conflict + cycling.powerZones band conflicts → coupled `"Cycling threshold + zones"` group row (per D-MA6). Verifies that the dialog renders the coupled group testid (`zones-conflict-group-cycling.threshold-and-zones`) and NOT a standalone FTP scalar row.

Existing flows (a) toggle-off, (b) silent-fill empty profile, (c) FTP conflict are unchanged — they exercise threshold-scalar paths that continue to work with the new payload shape via the convenience scalars (z4Upper, z5Lower).

Manual verification with Pablo's real T2G account + 3-iteration stability gate (§6.3, §6.4 of the change tasks) are deferred to follow-up issues filed at archive time.
