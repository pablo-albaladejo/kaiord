/**
 * The profile a workout's file export resolves pace zones against: the
 * profile that owns the persisted record when there is one — the same
 * profile a Garmin push of that record uses (`exportRecordGcn`) — and the
 * active profile for a workout not yet persisted.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { Profile } from "../types/profile";
import { useActiveProfileLive } from "./use-active-profile-live";

export const useExportProfile = (ownerProfileId?: string): Profile | null => {
  const active = useActiveProfileLive();
  const owner = useLiveQuery(
    async () =>
      ownerProfileId
        ? ((await db.table<Profile>("profiles").get(ownerProfileId)) ?? null)
        : null,
    [ownerProfileId]
  );
  return (ownerProfileId ? owner : active?.profile) ?? null;
};
