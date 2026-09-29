---
"@kaiord/workout-spa-editor": patch
---

Workouts with pace zone targets can be sent to Garmin again. Garmin Connect has no pace zone numbers, so each pace zone is now written as the m/s range of the athlete's own pace zones for the workout's sport, on every path that builds a Garmin payload (Send to Garmin, Send week, the chat tool and the GCN file download). When the profile has no pace zones for that sport, the send fails with a specific message asking the athlete to set their threshold pace in Athlete, instead of the generic "could not be sent", and an unexpected push failure now logs its (scrubbed) cause.
