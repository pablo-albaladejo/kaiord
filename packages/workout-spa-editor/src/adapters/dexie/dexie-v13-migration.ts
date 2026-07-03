/**
 * v12 → v13 migration — workouts become profile-scoped 1–1.
 *
 * Reads `meta.activeProfileId` once and assigns it to every legacy
 * `workouts` row that lacks `profileId`. Rows that already have the
 * field are skipped (idempotent on re-run).
 *
 * Failure mode: if `meta.activeProfileId` is missing or not a string
 * (degenerate state — the app always sets one at first profile creation)
 * AND the database has at least one workout, the upgrade throws with a
 * descriptive error. No silent fallback chain. Empty databases are a
 * no-op.
 */
import type { Transaction } from "dexie";

type MetaRow = { key: string; value: unknown };
type WorkoutRow = { id: string; profileId?: string };

const ACTIVE_PROFILE_KEY = "activeProfileId";

const readActiveProfileId = async (tx: Transaction): Promise<string | null> => {
  const row = (await tx.table("meta").get(ACTIVE_PROFILE_KEY)) as
    MetaRow | undefined;
  return typeof row?.value === "string" ? row.value : null;
};

export const applyV13Upgrade = async (tx: Transaction): Promise<void> => {
  const workoutCount = await tx.table("workouts").count();
  if (workoutCount === 0) return;
  const activeProfileId = await readActiveProfileId(tx);
  if (!activeProfileId) {
    throw new Error(
      "Dexie v13 upgrade aborted: meta.activeProfileId is missing but " +
        "workouts exist. Set an active profile before re-opening the app."
    );
  }
  await tx
    .table("workouts")
    .toCollection()
    .modify((row: WorkoutRow) => {
      if (typeof row.profileId !== "string" || row.profileId.length === 0) {
        row.profileId = activeProfileId;
      }
    });
};
