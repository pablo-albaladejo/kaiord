/**
 * useConnectionStatus — live map of `providerId → ConnectionRecord` for a
 * profile, read from the v24 `connections` store. Drives the Athlete
 * Connections UI from the real connection record (not policy inference).
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { ConnectionRecord } from "../types/connection";

const EMPTY: ReadonlyMap<string, ConnectionRecord> = new Map();

export const useConnectionStatus = (
  profileId: string | null
): ReadonlyMap<string, ConnectionRecord> =>
  useLiveQuery(
    async (): Promise<ReadonlyMap<string, ConnectionRecord>> => {
      if (!profileId) return EMPTY;
      const rows = await db
        .table<ConnectionRecord>("connections")
        .where("profileId")
        .equals(profileId)
        .toArray();
      return new Map(rows.map((row) => [row.providerId, row]));
    },
    [profileId],
    EMPTY
  );
