---
"@kaiord/workout-spa-editor": patch
---

Garmin scheduling reads the live calendar before it decides a write. Sending a Workout that Garmin already holds on its date adds no second entry, even when the App lost its record of it; an entry the athlete deleted in Garmin is put back once on the next send; a library workout the athlete deleted is re-created and placed in the same send; when the calendar cannot be read, nothing is written and the athlete is told Garmin is not answering, with Try again. Nothing Kaiord did not create is deleted or overwritten.
