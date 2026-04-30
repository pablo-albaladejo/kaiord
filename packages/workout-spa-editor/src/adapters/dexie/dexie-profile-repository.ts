/**
 * Dexie Profile Repository
 *
 * IndexedDB-backed implementation of ProfileRepository.
 * Uses a `meta` table for activeProfileId storage.
 */

import type Dexie from "dexie";

import type { ProfileRepository } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

const ACTIVE_PROFILE_KEY = "activeProfileId";

type Tables = { table: () => Dexie.Table; meta: () => Dexie.Table };

const buildActiveId = ({ meta }: Tables) => ({
  getActiveId: async (): Promise<string | null> => {
    const row = await meta().get(ACTIVE_PROFILE_KEY);
    return row?.value ?? null;
  },
  setActiveId: async (id: string | null): Promise<void> => {
    await meta().put({ key: ACTIVE_PROFILE_KEY, value: id });
  },
});

const buildDelete =
  ({ table, meta }: Tables) =>
  async (id: string): Promise<void> => {
    // Delete profile first, then clear activeId if it matched. Not wrapped
    // in a Dexie transaction to avoid TS2589 deep type instantiation —
    // acceptable for single-user SPA; the race window is negligible.
    await table().delete(id);
    const row = await meta().get(ACTIVE_PROFILE_KEY);
    if (row?.value === id) {
      await meta().put({ key: ACTIVE_PROFILE_KEY, value: null });
    }
  };

export function createDexieProfileRepository(
  db: KaiordDatabase
): ProfileRepository {
  const tables: Tables = {
    table: () => db.table("profiles"),
    meta: () => db.table("meta"),
  };

  return {
    getAll: async () => tables.table().toArray(),
    getById: async (id) => (await tables.table().get(id)) ?? undefined,
    put: async (profile) => {
      await tables.table().put(profile);
    },
    count: async () => tables.table().count(),
    ...buildActiveId(tables),
    delete: buildDelete(tables),
  };
}
