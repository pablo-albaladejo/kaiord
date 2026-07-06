/**
 * v28 → v29 migration — fail-open policy seeding (F1.5).
 *
 * Seeds `enabled` IntegrationPolicy rows for every route that is live TODAY, so
 * that once the governance gates are wired (F1.3 train2go import, F2 garmin
 * export) a currently-working profile keeps working without touching anything
 * (day-1 continuity; kill-test pre-mortem #2). Routes are derived from the
 * INTEGRATION_REGISTRY bridge ids intersected with the live path inventory:
 *   - `planned-session ← train2go-bridge` (import) for coaching-linked profiles
 *     (idempotent superset of the v28 partial seed);
 *   - `workout → garmin-bridge` (export) for profiles with a live garmin
 *     signal: a connected `connections` row OR a workout already pushed to
 *     Garmin (`garminPushId`) — the latter captures users who push via the
 *     extension without an athlete-connections row.
 *
 * `manual` / `fit-import` get NO policy (always active by design). Idempotent
 * vs re-run, the v17 zones backfill (different dataType), and the v28 seed.
 */
import type { Transaction } from "dexie";

import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";

const TRAIN2GO = "train2go";
const GARMIN = "garmin";

const bridgeIdFor = (providerId: string): string =>
  INTEGRATION_REGISTRY.find((e) => e.id === providerId)?.bridgeId ??
  `${providerId}-bridge`;

type PolicySeed = {
  profileId: string;
  dataType: string;
  direction: "import" | "export";
  bridgeId: string;
};

const seedPolicy = async (tx: Transaction, seed: PolicySeed): Promise<void> => {
  const existing = await tx
    .table("integrationPolicies")
    .where("[profileId+dataType+direction+bridgeId]")
    .equals([seed.profileId, seed.dataType, seed.direction, seed.bridgeId])
    .first();
  if (existing) return;
  await tx.table("integrationPolicies").add({
    id: crypto.randomUUID(),
    profileId: seed.profileId,
    dataType: seed.dataType,
    bridgeId: seed.bridgeId,
    direction: seed.direction,
    mode: "auto",
    enabled: true,
    updatedAt: new Date().toISOString(),
  });
};

type ProfileRow = { id: string; linkedAccounts?: Array<{ source: string }> };

const seedTrain2GoPlannedImport = async (tx: Transaction): Promise<void> => {
  const profiles = (await tx.table("profiles").toArray()) as ProfileRow[];
  const bridgeId = bridgeIdFor(TRAIN2GO);
  for (const p of profiles) {
    if (!p.linkedAccounts?.some((a) => a.source === TRAIN2GO)) continue;
    await seedPolicy(tx, {
      profileId: p.id,
      dataType: "planned-session",
      direction: "import",
      bridgeId,
    });
  }
};

const garminProfileIds = async (tx: Transaction): Promise<Set<string>> => {
  const ids = new Set<string>();
  const connections = (await tx.table("connections").toArray()) as Array<{
    profileId: string;
    providerId: string;
    status: string;
  }>;
  for (const c of connections) {
    if (c.providerId === GARMIN && c.status === "connected")
      ids.add(c.profileId);
  }
  const workouts = (await tx.table("workouts").toArray()) as Array<{
    profileId: string;
    garminPushId?: string | null;
  }>;
  for (const w of workouts) {
    if (w.garminPushId != null) ids.add(w.profileId);
  }
  return ids;
};

const seedGarminWorkoutExport = async (tx: Transaction): Promise<void> => {
  const bridgeId = bridgeIdFor(GARMIN);
  for (const profileId of await garminProfileIds(tx)) {
    await seedPolicy(tx, {
      profileId,
      dataType: "workout",
      direction: "export",
      bridgeId,
    });
  }
};

export const applyV29Upgrade = async (tx: Transaction): Promise<void> => {
  await seedTrain2GoPlannedImport(tx);
  await seedGarminWorkoutExport(tx);
};
