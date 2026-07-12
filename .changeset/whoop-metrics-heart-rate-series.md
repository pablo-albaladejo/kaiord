---
"@kaiord/whoop": minor
---

feat(whoop): add `metricsToHeartRateSeries` converter mapping WHOOP `metrics-service` heart_rate responses to the read-only `heart-rate-series` KRD health payload (buckets epoch-ms samples into a uniform `stepSeconds` array with `null` gaps)
