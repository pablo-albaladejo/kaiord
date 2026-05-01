---
"@kaiord/workout-spa-editor": patch
---

Add SPA-side foundation for the bridge popup profile-snapshot push: pure mapper from domain `Profile` to `ProfileSnapshot`, push adapter with content-fingerprint de-duplication via `@kaiord/core`'s `fingerprintSnapshot`, Dexie v6 schema migration that backfills `pendingClear: false` and `lastSuccessfulFingerprint: null` on existing bridge rows, and an extension of the R-PIIInterpolation guard to the bridge adapter directory. The trigger wiring (active-profile mutation effect, bridge-VERIFIED transition, profile-deletion clear) lands in a follow-up commit on the same PR.
