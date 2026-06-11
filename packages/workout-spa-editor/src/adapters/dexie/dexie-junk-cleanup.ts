/**
 * One-time guarded junk cleanup for untouched coaching template workouts.
 *
 * Uses the `meta` table as a flag so this runs AT MOST ONCE per browser
 * profile. The guard key is checked before doing any work; if the key
 * already exists the function returns immediately. On completion the key
 * is written so subsequent app opens skip the work entirely.
 *
 * Error handling: any failure is caught and logged; the function NEVER
 * throws so it cannot block app startup.
 */
import { removeUntouchedCoachingTemplates } from "../../application/coaching/remove-untouched-coaching-templates";
import { logger } from "../../utils/logger";
import type { KaiordDatabase } from "./dexie-database";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";
import { createDexieWorkoutRepository } from "./dexie-workout-repository";

const META_KEY = "junk-cleanup-v1";

export const runJunkCleanupOnce = async (db: KaiordDatabase): Promise<void> => {
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
