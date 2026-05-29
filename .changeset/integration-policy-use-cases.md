---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): integration-policy use cases + idempotent export ledger

Adds resolveImportPolicies / resolveExportPolicies / upsertIntegrationPolicy /
deleteIntegrationPolicy use cases. Adds upsertImportedRecord (natural-key
upsert against [profileId+sourceBridgeId+externalId]) and recordExport with
the insert-pending → POST → UPDATE protocol that closes the concurrent-
trigger race (unique constraint on [kaiordRecordId+destinationBridgeId]
gates the duplicate POST before the network call). Includes the AC-9
weight-export-aggregation integration test.

PR 4 of 7. Use cases are present but not yet wired into UI (PR 5/PR 6).
