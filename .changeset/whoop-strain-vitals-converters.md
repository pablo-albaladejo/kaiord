---
"@kaiord/whoop": minor
---

feat(whoop): add `cycleToStrain` and `cycleToVitals` converters mapping WHOOP cycle records to the read-only `strain` and `vitals` KRD health payloads (folds recovery SpO₂/skin-temp/resting-HR + sleep respiratory rate into one vitals summary; skips in-progress cycles)
