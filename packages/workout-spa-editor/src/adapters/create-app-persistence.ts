/**
 * The application's `PersistencePort` composition — the ONE place that says
 * how the SPA's persistence is assembled: the Dexie adapter wrapped in the
 * tombstone decorator, so deletes propagate across devices instead of being
 * resurrected by the next cloud-sync merge.
 *
 * Production (`main.tsx`, `dexie-junk-cleanup`) and the round-trip tests both
 * import this factory, so "is the decorator actually wired?" is an assertion
 * about behaviour rather than about the text of `main.tsx`.
 */

import type { PersistencePort } from "../ports/persistence-port";
import type { KaiordDatabase } from "./dexie/dexie-database";
import { createDexiePersistence } from "./dexie/dexie-persistence-adapter";
import { withTombstones } from "./with-tombstones";

export const createAppPersistence = (db?: KaiordDatabase): PersistencePort =>
  withTombstones(createDexiePersistence(db));
