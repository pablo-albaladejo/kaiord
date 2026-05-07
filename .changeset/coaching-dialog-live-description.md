---
"@kaiord/workout-spa-editor": patch
---

Fix coaching activity dialog stuck on "Loading description…" indefinitely.

`selectedActivity` was held as plain `useState<CoachingActivity>` in `useCalendarPage`, which froze the original reference at click time. When `expandActivity` populated the description into Dexie out-of-band, the live-query refresh updated `coaching.byDay` but the dialog's `activity` prop kept the stale `description: undefined` reference and the loading placeholder never disappeared.

Replaced with `useSelectedActivity(byDay)` which captures the click target by id only and re-derives the live view-model from `byDay` on every render — Dexie updates now propagate into the open dialog.
