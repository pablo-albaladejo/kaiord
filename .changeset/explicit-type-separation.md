---
"@kaiord/core": major
"@kaiord/fit": major
"@kaiord/tcx": major
"@kaiord/zwo": major
"@kaiord/cli": major
---

BREAKING: Rename KRD types for explicit separation (workout -> structured_workout, activity -> recorded_activity)

This is a breaking change to the KRD format schema:

- **Type field values changed**: `"workout"` -> `"structured_workout"`, `"activity"` -> `"recorded_activity"`
- **Extension key renamed**: `extensions.workout` -> `extensions.structured_workout`
- **Metadata field removed**: `metadata.fileType` removed (redundant with root `type`)
- **Event types prefixed**: All event types now use `event_` prefix (e.g., `"start"` -> `"event_start"`, `"workout_step"` -> `"event_workout_step_change"`)
- **Activity data relocated**: Recorded activity data (sessions, laps, records, events) moved from `extensions.recorded_activity` to top-level KRD fields

Old KRD files will need to be re-exported. No backward compatibility migration is provided.
