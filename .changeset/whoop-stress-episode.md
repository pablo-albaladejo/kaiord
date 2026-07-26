---
"@kaiord/whoop": minor
---

Add stress-bff schema and a stress→stress-episode converter.

**New**: `whoopStressResponseSchema` (BFF-tolerant model of
`health-service/v2/stress-bff/{date}`, pulling only
`gauge.gauge_fill_percentage`) and `extractStressPoints`, a defensive
walker over the un-modelled `stress_graph` timeline. `stressBffToEpisode`
maps the gauge's daily fill fraction to `averageLevel` and the timeline's
maximum point to `peakLevel` (floored at `averageLevel`), producing a KRD
`stress` episode spanning the full day; reuses the existing frozen
`stressEpisodeSchema` — no core change.
