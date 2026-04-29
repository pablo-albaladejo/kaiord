/**
 * useProfilesLive — reactive read hook for the full profiles list.
 *
 * Binds to the production Dexie singleton `db` (D1.3). In tests the
 * same `db` is backed by fake-indexeddb (loaded by `src/test-setup.ts`),
 * which fully implements the Dexie observable contract — so the hook
 * re-fires on writes through `PersistencePort.profiles.put` without
 * any test-only shim or module mock (D5.1).
 *
 * Returns `undefined` while loading on first mount; consumers SHALL
 * treat that as the loading state (skeleton or "Loading…") and not
 * confuse it with the empty-list state (`[]`).
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { Profile } from "../types/profile";

export const useProfilesLive = (): Profile[] | undefined =>
  useLiveQuery<Profile[]>(() => db.table<Profile>("profiles").toArray(), []);
