---
"@kaiord/workout-spa-editor": patch
---

Workouts with pace zone targets can be sent to Garmin again. Garmin Connect has no pace zone numbers, so each pace zone is now written as an m/s range, on every path that builds a Garmin payload (Send to Garmin, Send week, the chat tool and the GCN file download). The ranges are the ones the Athlete page shows: pace zones the athlete edited (or a coach sync wrote) win, otherwise Z1–Z5 derive from the threshold pace with the zone map's model, and the open ends of Z1 and Z5 get a bound 25% beyond the known one. The distance a pace is per comes from the workout's sport (1 km running, 100 m swimming). When the zones cannot be resolved, the send fails with a specific message (set your threshold pace, complete your pace zones, or pace zones only in running or swimming) instead of the generic "could not be sent", and an unexpected push failure now logs its (scrubbed) cause.
