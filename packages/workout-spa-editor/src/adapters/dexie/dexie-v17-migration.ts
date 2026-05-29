/**
 * v16 → v17 migration.
 *
 * Schema additions:
 *   - New store `integrationPolicies`: id PK, compound indices for
 *     profile-scoped routing queries and uniqueness.
 *   - New store `exportLedger`: id PK, unique [kaiordRecordId+destinationBridgeId].
 *   - Six health stores (healthSleep, healthWeight, healthHrv, healthDaily,
 *     healthBodyComposition, healthStress) gain `sourceBridgeId` + `externalId`
 *     columns and a unique [profileId+sourceBridgeId+externalId] index.
 *
 * The upgrade runs two backfills (both idempotent):
 *   1. backfillHealthProvenance — stamps sourceBridgeId='manual' + a
 *      deterministic externalId on every legacy health row.
 *   2. backfillSyncZonesPolicies — converts linkedAccount.syncZones=true
 *      entries into IntegrationPolicy rows.
 *
 * 'syncZones' column retained nullable in v17 as rollback buffer; full drop in v18 (F-4).
 */
import type { Transaction } from "dexie";

import { backfillHealthProvenance } from "./dexie-v17-provenance-backfill";
import { backfillSyncZonesPolicies } from "./dexie-v17-syncZones-backfill";

const HEALTH_SUFFIX =
  ", sourceBridgeId, externalId, [profileId+sourceBridgeId+externalId]";

export const SCHEMA_V17 = {
  integrationPolicies:
    "id, [profileId+dataType+direction], &[profileId+dataType+direction+bridgeId], profileId",
  exportLedger:
    "id, &[kaiordRecordId+destinationBridgeId], kaiordRecordId, destinationBridgeId",
  healthSleep: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthWeight: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthHrv: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthDaily: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthBodyComposition: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
  healthStress: `id, profileId, [profileId+date], date${HEALTH_SUFFIX}`,
} as const;

export const applyV17Upgrade = async (tx: Transaction): Promise<void> => {
  await backfillHealthProvenance(tx);
  await backfillSyncZonesPolicies(tx);
};
