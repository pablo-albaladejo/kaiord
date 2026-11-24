---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
---

When an extension cannot load its list of personal fields, it no longer hands the Kaiord App untrimmed answers: every request fails before anything is asked of the Platform, as when its answer code is missing.
