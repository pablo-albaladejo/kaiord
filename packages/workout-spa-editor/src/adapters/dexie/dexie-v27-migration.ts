/**
 * v26 → v27 migration — Data Hub domain tables.
 *
 * Two data-side steps (both idempotent under Dexie's once-per-bump gate):
 *   1. Copy every `coachingActivities` row into `plannedSessions`,
 *      preserving the composite `CoachingActivityRecord.id` verbatim so
 *      `SessionMatch.coachingActivityId` keeps resolving (R-SessionMatchIdShape:
 *      ids flow through `record.id`, never reconstructed here). The source
 *      `coachingActivities` table is RETAINED this version for reversibility.
 *   2. Rewrite `integrationPolicies.dataType` "training-plan" → "planned-session"
 *      for EVERY matching row (orphans included): the policy reader casts
 *      without validating, so a stale "training-plan" row would make the Data
 *      Hub throw on `MANAGED_DATA_REGISTRY["training-plan"]` once the type is
 *      gone.
 */
import type { Transaction } from "dexie";

const migrateCoachingActivitiesToPlannedSessions = async (
  tx: Transaction
): Promise<void> => {
  const rows = await tx.table("coachingActivities").toArray();
  if (rows.length === 0) return;
  await tx.table("plannedSessions").bulkPut(rows);
};

const rewriteTrainingPlanPolicies = async (tx: Transaction): Promise<void> => {
  await tx
    .table("integrationPolicies")
    .toCollection()
    .modify((policy) => {
      const p = policy as { dataType?: string };
      if (p.dataType === "training-plan") p.dataType = "planned-session";
    });
};

export const applyV27Upgrade = async (tx: Transaction): Promise<void> => {
  await migrateCoachingActivitiesToPlannedSessions(tx);
  await rewriteTrainingPlanPolicies(tx);
};
