/**
 * v27 → v28 migration — provenance backfill + partial policy seeding (F1.2/1.3).
 *
 * Two idempotent data-side steps:
 *   1. Stamp `sourceBridgeId:"unknown"` on historical rows that were written
 *      WITHOUT provenance — the six health stores + `activities`. New rows
 *      (F1.1 health imports, F0 dual-write activities) already carry a real
 *      source, so re-running only touches rows that still lack one. Workouts
 *      keep their existing `source` column (no `sourceBridgeId` field applies).
 *   2. Seed a default enabled `planned-session` import policy for every profile
 *      with an active Train2Go link, so that once the train2go sync is gated on
 *      that policy (F1.3) a currently-syncing profile keeps syncing untouched.
 *      This is a PARTIAL advance of the F1.5 fail-open seeding (which will add
 *      the remaining live routes, e.g. workout→garmin export).
 */
import type { Transaction } from "dexie";

const PROVENANCE_TABLES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
  "activities",
] as const;

const TRAIN2GO = "train2go";
const TRAIN2GO_BRIDGE = "train2go-bridge";
const PLANNED_SESSION = "planned-session";

const backfillUnknownProvenance = async (tx: Transaction): Promise<void> => {
  for (const name of PROVENANCE_TABLES) {
    await tx
      .table(name)
      .toCollection()
      .modify((row) => {
        const r = row as { sourceBridgeId?: string };
        if (!r.sourceBridgeId) r.sourceBridgeId = "unknown";
      });
  }
};

type ProfileRow = { id: string; linkedAccounts?: Array<{ source: string }> };

const seedTrain2GoImportPolicy = async (tx: Transaction): Promise<void> => {
  const profiles = (await tx.table("profiles").toArray()) as ProfileRow[];
  for (const profile of profiles) {
    const linked = profile.linkedAccounts?.some((a) => a.source === TRAIN2GO);
    if (!linked) continue;
    const existing = await tx
      .table("integrationPolicies")
      .where("[profileId+dataType+direction+bridgeId]")
      .equals([profile.id, PLANNED_SESSION, "import", TRAIN2GO_BRIDGE])
      .first();
    if (existing) continue;
    await tx.table("integrationPolicies").add({
      id: crypto.randomUUID(),
      profileId: profile.id,
      dataType: PLANNED_SESSION,
      bridgeId: TRAIN2GO_BRIDGE,
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: new Date().toISOString(),
    });
  }
};

export const applyV28Upgrade = async (tx: Transaction): Promise<void> => {
  await backfillUnknownProvenance(tx);
  await seedTrain2GoImportPolicy(tx);
};
