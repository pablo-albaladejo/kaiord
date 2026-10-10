/**
 * Creates the first-run default profile from Dexie's `ready` hook.
 *
 * Returning the promise makes Dexie hold every queued database operation
 * until the creation settles, so nothing issued after page load (a UI read,
 * an e2e seeder that clears and re-seeds `profiles`) can interleave with
 * it. The work runs under `Dexie.vip` so it is not queued behind the very
 * readiness it is holding. It is a count on every open, and the synchronous
 * name lookup plus the write only when that count is 0, so readiness never
 * waits on anything but the database. `ensureDefaultProfile` re-counts in
 * its own transaction (two tabs) and is fail-open.
 *
 * The subscription is sticky, so every open runs it, not only the first:
 * a database closed and reopened with no profile gets one again.
 */

import Dexie from "dexie";

import { ensureDefaultProfile } from "../../application/profile/ensure-default-profile";
import type { PersistencePort } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

export const registerDefaultProfileBoot = (
  db: KaiordDatabase,
  persistence: PersistencePort,
  resolveName: () => string
): void => {
  db.on(
    "ready",
    () =>
      Dexie.vip(async () => {
        // A failed count skips the creation: boot must never break on it.
        const empty = await persistence.profiles.count().then(
          (n) => n === 0,
          () => false
        );
        if (empty) await ensureDefaultProfile(persistence, resolveName());
      }),
    true
  );
};
