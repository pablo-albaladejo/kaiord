---
"@kaiord/workout-spa-editor": minor
---

Train2Go zones-sync — UI + connect/sync fan-out (PR 3/3 of the `train2go-zones-sync` change).

- New "Sync zones" toggle on the Linked Account row for Train2Go. Visible only while linked AND the discovered bridge advertises `read:training-zones` (older bridges never see the control). Defaults off; persists alongside the linked-account record.
- New `ZonesConflictDialog` component with per-row accept/reject. Hard XSS contract: NEVER uses `dangerouslySetInnerHTML`; field labels come from a static `FieldKey` → human-label map, NEVER from any T2G-supplied string. Numeric values render as React children.
- `useConnectCallback` and `useSyncCallback` fan out into the `syncZones` use case after a successful link / weekly read AND the persisted account has `syncZones === true`. Errors are toasted, never thrown — the connect / calendar sync still succeeds when the zones-sync side-quest fails.
- New `useZonesSyncOrchestrator` hook owns the two-phase flow: `runSync` invokes the use case + stashes conflicts; `confirmDecisions` invokes `commitConflictResolution` with the user's per-row choices. Idempotent.
- Bridge discovery now exposes `getCapabilities(bridgeId)` returning the verified manifest's capability list. The new `useTrain2GoSupportsZones` hook wires this through `useSyncExternalStore` so the toggle updates reactively when the bridge announces.
- Toast copy comes from the SCREAMING_SNAKE_CASE constants in `application/coaching/sync-zones.ts` (mechanical guard `check-no-pii-leakage` enforces static toast strings).
- Web Store listing copy enumerates the read scope when zones-sync is enabled, plus the explicit deny-list of fields NOT extracted (gender, birthday, fat%, IMC, smoker, bpm_rest, coach contact details).
- 16 new unit tests cover toggle visibility / capability gating / persistence, dialog render + accept/reject/cancel paths, and connect/sync fan-out + error isolation.

Manual e2e (per design tasks §9.5) is the user's verification step; an automated Playwright e2e at `packages/workout-spa-editor/e2e/zones-sync.spec.ts` is deferred to a follow-up issue (real bridge stub requires a loaded extension).
