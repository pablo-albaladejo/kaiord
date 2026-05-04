---
"@kaiord/train2go-bridge": minor
---

Train2Go bridge parser now extracts full Z1-Z5 zone bands per block (HR, power, pace) from `/user/details`, alongside the existing `z4Upper` / `z5Lower` convenience scalars (preserved for backwards compatibility). New emitted fields:

- `payload.hrZones.generic.{z1..z5: {lower, upper}}` (Karvonen-derived; new — was absent before)
- `payload.hrZones.{cycling, running, swimming}.{z1..z5: {lower, upper}, z4Upper}` (full bands; swimming is new — only cycling and running were emitted before)
- `payload.paces.cycling.{z1..z5: {lower, upper}, z4Upper, z5Lower}` (watts integers; full bands)
- `payload.paces.{running, swimming}.{z1..z5: {lower:{min,sec}, upper:{min,sec}}, z4Upper}` (min:sec pairs; full bands)
- `payload.physiological.bpmRest` (allowlisted; previously dropped — flows through but no SPA consumer in this change)

Privacy surface widens within the already-allowlisted `/user/details` path. No new endpoints, no new Chrome permissions, no new `externally_connectable` matches. The redaction key-walk test enforces the post-change forbidden set: `gender, birthday, fat, smoker, imc, user_notes, email, records, tests` (top-level) plus `coach.email, coach.name` (nested). The DOM-level snake_case `bpm_rest` is still forbidden; only the camelCased emit form is permitted. Store-listing copy enumerates the new fields explicitly.

Backwards-compat: existing FieldKey-level writes for `cycling.thresholds.ftp`, `cycling.thresholds.lthr`, `running.thresholds.lthr`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `bodyWeight`, and `heartRate.max` keep working byte-identically — the parser emits both the new band shape AND the legacy z4Upper convenience field.
