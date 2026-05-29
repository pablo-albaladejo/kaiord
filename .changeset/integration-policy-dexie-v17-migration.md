---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): Dexie v17 — integrationPolicies + exportLedger stores; health provenance + syncZones-to-IntegrationPolicy backfill

Bumps Dexie schema to v17. Adds the integrationPolicies and exportLedger
stores, alters all six health stores with a [profileId+sourceBridgeId+externalId]
unique compound index, and runs an idempotent chunked backfill that stamps
sourceBridgeId='manual' + a deterministic externalId on every legacy health row.
A second backfill walks linkedAccounts and creates an IntegrationPolicy
(dataType='training-zones', mode='auto', enabled=true) for every profile that
had syncZones=true. The syncZones column is retained nullable as a rollback
buffer until v18 (F-4).

QuotaExceededError on Safari/Firefox mid-chunk surfaces via the injected error
callback and leaves the partial backfill in place; per-row writes are
idempotent on retry. Export ledger cascades on health/workout record deletion;
an orphan sweep is available for new-machine disaster recovery.

PR 3 of 7 implementing integration-policy-per-profile-routing.
