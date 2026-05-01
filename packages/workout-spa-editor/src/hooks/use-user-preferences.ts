/**
 * useUserPreferences — reactive read of the per-profile UI preferences
 * (compact / comfortable calendar density, future expansions).
 *
 * Falls back to a synthesised default when no row exists; the caller
 * (UI layer) supplies `defaultDensity` based on viewport width since
 * the hook itself is viewport-agnostic.
 *
 * Re-evaluates on profileId change and on writes to the underlying
 * `userPreferences` table; previous-profile values never leak.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type {
  CalendarDensity,
  UserPreferences,
} from "../types/user-preferences";

export type UseUserPreferencesArgs = {
  profileId: string | null;
  defaultDensity: CalendarDensity;
};

const synthesizeDefault = (
  profileId: string,
  defaultDensity: CalendarDensity
): UserPreferences => ({
  profileId,
  calendarDensity: defaultDensity,
  updatedAt: new Date().toISOString(),
});

export const useUserPreferences = ({
  profileId,
  defaultDensity,
}: UseUserPreferencesArgs): UserPreferences | undefined =>
  useLiveQuery<UserPreferences | undefined>(async () => {
    if (!profileId) return undefined;
    const persisted = await db
      .table<UserPreferences>("userPreferences")
      .get(profileId);
    return persisted ?? synthesizeDefault(profileId, defaultDensity);
  }, [profileId, defaultDensity]);
