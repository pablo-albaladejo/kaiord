---
"@kaiord/workout-spa-editor": minor
---

Block re-sending a TrainingPeaks workout that was moved or edited since it was pushed: TrainingPeaks is create-only for Kaiord, so a re-send would leave a second copy. The ledger now records the pushed day, the message names it when the workout moved, and "Send a copy anyway" stays available behind a confirmation.
