---
"@kaiord/mcp": minor
---

New `missing-max-hr` error type. `kaiord_convert` to GCN and `kaiord_garmin_push` fail with it when a workout has `percent_max` heart-rate targets, because the tools don't take a max heart rate yet. The suggestion tells the agent to rewrite those targets as bpm. Before this change, the percentages were silently written to Garmin as bpm.
