---
"@kaiord/garmin-bridge": minor
"@kaiord/trainingpeaks-bridge": minor
"@kaiord/workout-spa-editor": minor
"@kaiord/docs": patch
---

Kaiord deletes nothing from the athlete's Garmin library: an edit sent again leaves the earlier version there, and Kaiord for Garmin refuses `DELETE /workout-service/workout/{id}`. The Kaiord App records each library version Kaiord created, and its delete of an earlier version no calendar entry uses is built and tested but off (`GARMIN_LIBRARY_DELETES`) until the owner's live capture of how Garmin answers that delete. Kaiord for TrainingPeaks can read the workouts of one day (`GET /fitness/v6/athletes/{id}/workouts/{day}/{day}`). After a send whose answer never arrived, the next send of that workout reads that day first: if a workout with the same title is there, or the day cannot be read, it sends nothing and asks, with "Send anyway". In English and Spanish. The store listings, justifications and privacy policy say the same.
