---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): resolver re-wiring — GarminPushButton, Train2Go zones, save-workout export trigger

GarminPushButton is now gated on resolveExportPolicies(profileId, 'workout')
instead of `extensionInstalled` alone. use-train2go-supports-zones.ts is
deleted; callers consult resolveImportPolicies(profileId, 'training-zones').
A regression test asserts the hook stays gone. A save-workout export trigger
listens for entitySaved events and fires recordExport for every enabled
mode='auto' export policy. Removes the transitional `as unknown as`
LinkedCoachingAccount casts from PR 2 and the deprecated SyncZonesToggle UI
(PR 6 introduces the Data Flows section as the replacement).

PR 5 of 7.
