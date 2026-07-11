/**
 * Session maintenance run, attached to the `db.on("ready")` hook.
 *
 * Two independent jobs, both fail-open (errors are logged, never thrown, so
 * they cannot block app startup):
 *   1. Retention prune of the synced `usageEvents` log — runs EVERY session
 *      (not gated by the once-only flag) so tombstones for events past the
 *      12-month window ride the next sync push and keep the snapshot bounded.
 *   2. One-time junk cleanup of untouched coaching template workouts, guarded
 *      by a `meta` flag so it runs at most once per browser profile.
 */
import { removeUntouchedCoachingTemplates } from "../../application/coaching/remove-untouched-coaching-templates";
import { pruneUsageEvents } from "../../application/usage/prune-usage-events";
import { logger } from "../../utils/logger";
import { withTombstones } from "../with-tombstones";
import type { KaiordDatabase } from "./dexie-database";
import { createDexiePersistence } from "./dexie-persistence-adapter";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";
import { createDexieWorkoutRepository } from "./dexie-workout-repository";

const META_KEY = "junk-cleanup-v1";

// Deletes go through the tombstoning port so a pruned event's removal
// propagates cross-device. Runs opportunistically; swallows its own errors.
const pruneOldUsageEvents = async (db: KaiordDatabase): Promise<void> => {
  try {
    await pruneUsageEvents(withTombstones(createDexiePersistence(db)));
  } catch (err) {
    logger.warn("[usage-prune] failed, skipping", { err });
  }
};

export const runJunkCleanupOnce = async (db: KaiordDatabase): Promise<void> => {
  await pruneOldUsageEvents(db);
  try {
    const already = await db.table("meta").get(META_KEY);
    if (already !== undefined) return;

    const workouts = createDexieWorkoutRepository(db);
    const sessionMatch = createDexieSessionMatchRepository(db);
    await removeUntouchedCoachingTemplates(workouts, sessionMatch);

    await db.table("meta").put({ key: META_KEY, value: true });
  } catch (err) {
    logger.warn("[junk-cleanup] failed, skipping", { err });
  }
};
