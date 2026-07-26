---
"@kaiord/whoop": minor
---

Add biomarker-tests/summary schemas for WHOOP Advanced Labs.

**New**: `whoopBiomarkerTestSchema` / `whoopBiomarkerTestsResponseSchema`
model the `advanced-labs-service/v1/biomarker-tests` list (bare array,
`{records: [...]}`, or `{tests: [...]}`, all normalized to an array).
`whoopBiomarkerSchema` / `whoopBiomarkerSummarySchema` model the
`.../biomarker-tests/{id}/summary` detail response — a per-test catalog of
biomarkers, most `status: "UNAVAILABLE"` since a given draw only measures a
subset. Both schemas are lenient (every biomarker field beyond
`biomarker_name` is `.nullish()`) and non-strict, tolerating WHOOP payload
drift. `measuredBiomarkers` filters a parsed summary down to the biomarkers
WHOOP actually measured (`status` present and not `"UNAVAILABLE"`).

Building the KRD `LabReport`/`LabValue` from these shapes (canonical unit +
flag) is left to the SPA-side importer — this package only exposes the
parsed WHOOP data.
