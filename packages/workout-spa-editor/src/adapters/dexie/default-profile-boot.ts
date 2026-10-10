/**
 * Creates the first-run default profile from Dexie's `ready` hook.
 *
 * Returning the promise makes Dexie hold every queued database operation
 * until the creation settles, so nothing issued after page load (a UI read,
 * an e2e seeder that clears and re-seeds `profiles`) can interleave with
 * it. The name is resolved first, outside any transaction; the transaction
 * then runs under `Dexie.vip` so it is not queued behind the very readiness
 * it is holding. `ensureDefaultProfile` is idempotent and fail-open, and the
 * name resolver never rejects, so readiness always resumes.
 */

import Dexie from "dexie";

import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import type { PersistencePort } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

export const registerDefaultProfileBoot = (
  db: KaiordDatabase,
  persistence: PersistencePort,
  resolveName: () => Promise<string>
): void => {
  db.on("ready", async () => {
    const name = await resolveName();
    await Dexie.vip(() => ensureDefaultProfile(persistence, name));
  });
};
