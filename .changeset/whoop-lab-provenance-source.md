---
"@kaiord/core": minor
---

Add `"whoop"` to the lab provenance `source` enum (`manual | ai-extracted |
whoop`), so a WHOOP Advanced Labs import can be attributed the same way an
AI-extracted lab report is. Additive: `sourceBridgeId`/`externalId` were
already optional on `labProvenanceSchema`.
