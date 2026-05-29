/**
 * v17 syncZones backfill — converts linkedAccount.syncZones=true entries
 * into IntegrationPolicy rows (dataType='training-zones', mode='auto').
 *
 * Iterates every profile, inspects its `linkedAccounts` array for any
 * entry where `source === 'train2go'` AND `syncZones === true`, then
 * inserts a canonical IntegrationPolicy row unless one already exists
 * for (profileId, dataType, direction, bridgeId) — making the backfill
 * idempotent.
 */
import type { Transaction } from "dexie";

type LinkedAccount = {
  source?: string;
  syncZones?: boolean;
};

type ProfileRow = {
  id: string;
  linkedAccounts?: LinkedAccount[];
};

type PolicyRow = {
  id: string;
  profileId: string;
  dataType: string;
  bridgeId: string;
  direction: string;
  mode: string;
  enabled: boolean;
  updatedAt: string;
};

type BackfillResult = { inserted: number; skipped: number };

const BRIDGE_ID = "train2go-bridge";
const DATA_TYPE = "training-zones";
const DIRECTION = "import";

export async function backfillSyncZonesPolicies(
  tx: Transaction
): Promise<BackfillResult> {
  const result: BackfillResult = { inserted: 0, skipped: 0 };

  const profiles = (await tx.table("profiles").toArray()) as ProfileRow[];

  for (const profile of profiles) {
    const accounts = profile.linkedAccounts ?? [];
    const hasSyncZones = accounts.some(
      (a) => a.source === "train2go" && a.syncZones === true
    );
    if (!hasSyncZones) continue;

    const existing = await tx
      .table("integrationPolicies")
      .where("[profileId+dataType+direction+bridgeId]")
      .equals([profile.id, DATA_TYPE, DIRECTION, BRIDGE_ID])
      .first();

    if (existing) {
      result.skipped++;
      continue;
    }

    const row: PolicyRow = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      dataType: DATA_TYPE,
      bridgeId: BRIDGE_ID,
      direction: DIRECTION,
      mode: "auto",
      enabled: true,
      updatedAt: new Date().toISOString(),
    };
    await tx.table("integrationPolicies").add(row);
    result.inserted++;
  }

  return result;
}
