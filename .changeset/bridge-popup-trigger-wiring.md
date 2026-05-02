---
"@kaiord/workout-spa-editor": patch
---

Wire the SPA's active profile to the bridge popup snapshot push. Adds `useProfileSnapshotPush` (mounted in `App`) which observes the joined live view of `meta.activeProfileId + profiles[id]` and the `bridges` Dexie table; on every change, derives a `ProfileSnapshot` via the existing mapper and dispatches `pushSnapshot` to each VERIFIED bridge with content-fingerprint de-duplication. Profile deletion (`id` transitions from set to `null`) emits `profile-snapshot-clear` to every VERIFIED bridge. Closes the trigger-wiring gap from the original `bridge-popup-redesign` rollout where the push pipeline foundation shipped without a caller; popups previously stayed on the "No profile yet" placeholder regardless of profile state.
