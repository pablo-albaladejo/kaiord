---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 2: introduce a `StatusHeader` molecule rendering
four surfaces — active profile, Garmin connection state, Train2Go
sync state, and a `+ New workout` button — and wire it into
`LayoutHeader` behind the `ux2026.spineHeader` feature flag. The
flag defaults to `false` so the legacy header keeps rendering;
flipping the flag to `true` in a follow-up PR (+ redeploy) swaps
in the new header without any consumer code change.

Source contexts for the four surfaces are unchanged
(`useActiveProfileLive`, `useGarminBridge`, `useTrain2GoZonesSync`)
so the data flow stays consistent with the rest of the app. Plan
reference: §"PR D" of
`.omc/plans/ralplan-ux-redesign-phase1-leftovers-and-phase2.md`.

Includes 5 unit tests for the StatusHeader's default state. No
behavioural change while the flag is off.
