/**
 * Dexie implementation of ConnectionRepository (v24 `connections` store).
 * Composite PK `[profileId+providerId]`; `profileId` index serves per-profile
 * reads and the profile-delete cascade.
 */
import type { ConnectionRepository } from "../../application/connections/connection-repository.port";
import type { ConnectionRecord } from "../../types/connection";
import type { KaiordDatabase } from "./dexie-database";

export const createDexieConnectionRepository = (
  db: KaiordDatabase
): ConnectionRepository => ({
  getByProfile: async (profileId) =>
    (await db
      .table("connections")
      .where("profileId")
      .equals(profileId)
      .toArray()) as ConnectionRecord[],

  get: async (profileId, providerId) =>
    (await db.table("connections").get([profileId, providerId])) as
      | ConnectionRecord
      | undefined,

  put: async (record: ConnectionRecord) => {
    await db.table("connections").put(record);
  },

  delete: async (profileId, providerId) => {
    await db.table("connections").delete([profileId, providerId]);
  },

  deleteByProfile: async (profileId) => {
    await db.table("connections").where("profileId").equals(profileId).delete();
  },
});

export type { ConnectionRepository };
