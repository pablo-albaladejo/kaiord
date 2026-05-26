---
"@kaiord/core": minor
"@kaiord/workout-spa-editor": minor
---

feat(core,spa): domain provenance fields + IntegrationPolicy/ExportLedger schemas

Adds kaiordRecordId, sourceBridgeId, externalId as optional fields to the six health Zod schemas (sleep, weight, hrv, daily, body-composition, stress); introduces deriveExternalId mapper in @kaiord/core/ingest; adds IntegrationPolicy + ExportLedgerEntry Zod schemas in @kaiord/workout-spa-editor; removes syncZones from linkedCoachingAccountSchema (Zod only — Dexie column retained as rollback buffer until v18).

PR 2 of 7 implementing integration-policy-per-profile-routing.
