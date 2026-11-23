---
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/workout-spa-editor": patch
---

Sending a workout to TrainingPeaks states the Basic account limit where the athlete acts: for any day the account may count as after tomorrow (TrainingPeaks counts in the account's time zone, which the App cannot know, so the notice assumes the zone furthest behind, UTC-12:00), the Kaiord App says, before sending, that a Basic account accepts only today and tomorrow, counted in the account's time zone, and TrainingPeaks' refusal of such a day (a 402) says the workout was not sent and why, in English and Spanish, instead of a raw error.

Before sending a workout again, the Kaiord App reads the copy it sent earlier through a new `read-workout` action (`GET /fitness/v6/athletes/{id}/workouts/{workoutId}`, returning only the workout's id and day). A copy the athlete deleted on TrainingPeaks is sent again instead of being reported as already there, and a changed workout whose earlier copy is gone is sent without asking. Only a 404 counts as gone; any other answer keeps the existing behaviour, so a re-send never adds a second copy silently.

A server error on the token exchange no longer reaches the Kaiord App as a revoked sign-in (#1105): only a redirect, 401 or 403 sets `needsReauth`, and `checkSession` reports whether TrainingPeaks said the session is dead or only failed to answer, so the App says "TrainingPeaks is not answering. Try again." instead of asking the athlete to sign in.
