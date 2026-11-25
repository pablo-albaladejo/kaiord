---
"@kaiord/workout-spa-editor": minor
---

The coaching dialog lets the athlete steer, rebuild, delete and split the Workout the AI built for a Coaching Activity. "Your note" ("Tu nota") is read by the assistant after the coach's text, which is never changed; it is stored in its own store (Dexie v41), synced and backed up like Workouts, and never sent to Train2Go. Regenerate rebuilds the Workout in place (same Match, same Day), asking first after hand edits and warning when it is on the watch; it goes back to Ready and the earlier version stays in Garmin's library. Delete workout removes the Workout and its Match, with Undo for both; the detail page's delete removes the Match too, so an Activity is never left stuck. Split stays split, from either Split button.
