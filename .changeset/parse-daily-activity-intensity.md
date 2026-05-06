---
"@kaiord/train2go-bridge": patch
---

Fix `parseDailyHtml` returning empty descriptions for non-default-intensity activities. T2G's daily HTML labels each activity wrapper with `activity activity-{level}` where `{level}` mirrors the workload intensity (`default` | `low` | `medium` | `high`). The split-on-activity-boundary regex was anchored on `activity-default` only, so any other intensity left `extractDescription` running on an empty slice and persisting `description: ""`.

Visible symptom: clicking a coaching card with non-default intensity opened a dialog whose description never populated (the upsert ran with `description: ""`, so subsequent renders showed neither the loading state nor the actual content). After this fix all four documented intensity levels split correctly and the description body is extracted.
