---
"@kaiord/core": minor
---

Add `profileSnapshotSchema` + `ProfileSnapshot` DTO, `STALE_SNAPSHOT_THRESHOLD_DAYS` constant, and `fingerprintSnapshot` content-hash helper as the cross-cutting protocol contract for the SPA → Bridge popup snapshot push. Also exposes `snapshotFixtures` from `@kaiord/core/test-utils` for parity tests across the SPA and each bridge's plain-JS validator.
