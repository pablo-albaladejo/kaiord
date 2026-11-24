---
"@kaiord/garmin-bridge": minor
"@kaiord/trainingpeaks-bridge": minor
"@kaiord/workout-spa-editor": minor
"@kaiord/docs": patch
---

Kaiord for Garmin can delete one library workout by its id (`DELETE /workout-service/workout/{id}`, no body, only from the exact App origin). The Kaiord App uses it only for an earlier version Kaiord created that an edit replaced and that no calendar entry uses: an edit now leaves one library workout. It never deletes a workout the athlete created, keeps a version still on a date or whose month cannot be read, and retries a failed delete on the next send. Kaiord for TrainingPeaks can read the workouts of one day (`GET /fitness/v6/athletes/{id}/workouts/{day}/{day}`). After a send whose answer never arrived, the next send of that workout reads that day first: if a workout with the same title is there, or the day cannot be read, it sends nothing and asks, with "Send anyway". In English and Spanish. The store listings, justifications and privacy policy say the same.
