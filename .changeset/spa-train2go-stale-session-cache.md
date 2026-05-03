---
"@kaiord/workout-spa-editor": patch
---

Fix the calendar header showing "Connect to Train2Go" right after the user successfully linked the account in Profile Manager. The Train2Go detection cache was holding onto stale negative results and the SPA never re-detected after the link dance, so the source's `sessionActive` flag would say `false` while the persisted `linkedAccounts` already had the entry — a UX contradiction the user could only resolve by hard-reloading the tab. Three small changes:

- `createDetectAction` now caches only positive results (was: any result with `extensionInstalled: true`). A previous "session inactive" no longer suppresses subsequent detections.
- `detectExtension({ force: true })` bypasses the cache for an explicit re-check.
- The Train2Go `connect` callback fires a forced re-detect after `attemptLink` succeeds, so the source's `connected` flag flips to `true` immediately.
- `useTrain2GoDetection` also runs a forced detect on `visibilitychange` so returning to the tab after a Connect dance always reflects reality.
