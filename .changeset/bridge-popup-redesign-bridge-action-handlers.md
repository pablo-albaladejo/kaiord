---
"@kaiord/garmin-bridge": minor
"@kaiord/train2go-bridge": minor
---

Wire the new SPA → Bridge protocol actions: both bridges now accept `profile-snapshot` (validated, persisted to `chrome.storage.local`) and `profile-snapshot-clear` (idempotent purge of `profileSnapshot` + `lastWeeklyRollup`). Each bridge ships a hand-rolled plain-JS structural validator that mirrors the Zod schema from `@kaiord/core` and rejects prototype-pollution payloads, oversized JSON (>8192 UTF-16 code units), unsupported schema versions, and unknown enum values; parity is enforced by a shared fixture set loaded from `@kaiord/core/test-utils`. The external-message listener gates the snapshot actions on `sender.origin` matching `externally_connectable.matches` (defense-in-depth). Train2Go's manifest gains the `storage` permission. A new `scripts/check-bridge-privacy-surface.mjs` mechanical guard locks the CWS-relevant surface (manifest permissions + host_permissions + content_scripts.matches + externally_connectable.matches + content-script ALLOWED arrays + popup.js fetch URLs) against drift via a checked-in golden snapshot.
