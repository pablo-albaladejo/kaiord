---
"@kaiord/workout-spa-editor": patch
---

Before sending a Workout again to TrainingPeaks after a send that got no answer, Kaiord now confirms an empty day with a second read 3 seconds later, as Garmin's placement does. TrainingPeaks can commit the first send after the App gave up on it; the second read sees it, so the athlete is asked instead of getting a duplicate.
