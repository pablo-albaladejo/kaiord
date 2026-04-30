/**
 * useActiveProfileLive — reactive read hook joining `meta.activeProfileId`
 * with the matching `profiles` row.
 *
 * The join runs inside a SINGLE `useLiveQuery` callback (design D1).
 * Dexie evaluates the entire callback inside an implicit per-callback
 * read transaction, so within one tab consumers never observe an
 * intermediate state where `id` references a profile that has not
 * yet been observed. Cross-tab atomicity is NOT guaranteed.
 *
 * Returns `undefined` while loading on first mount; once resolved,
 * `{ id, profile }` where `id` is `null` when no active profile is
 * set, and `profile` is `null` when the active id points at a
 * deleted/unknown row.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { Profile } from "../types/profile";

export type ActiveProfile = {
  id: string | null;
  profile: Profile | null;
};

const ACTIVE_PROFILE_KEY = "activeProfileId";

export const useActiveProfileLive = (): ActiveProfile | undefined =>
  useLiveQuery<ActiveProfile>(async () => {
    const idRow = await db.table("meta").get(ACTIVE_PROFILE_KEY);
    const id = (idRow?.value ?? null) as string | null;
    const profile = id
      ? ((await db.table<Profile>("profiles").get(id)) ?? null)
      : null;
    return { id, profile };
  }, []);
