/**
 * useUserPreferences — reactive read of the per-profile UI preferences
 * (calendar view (grid/list), future expansions).
 *
 * Falls back to a synthesised default when no row exists; the caller
 * (UI layer) supplies `defaultView` based on viewport width since
 * the hook itself is viewport-agnostic.
 *
 * Re-evaluates on profileId change and on writes to the underlying
 * `userPreferences` table; previous-profile values never leak.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import type { CalendarView, UserPreferences } from "../types/user-preferences";

export type UseUserPreferencesArgs = {
  profileId: string | null;
  defaultView: CalendarView;
};

const synthesizeDefault = (
  profileId: string,
  defaultView: CalendarView
): UserPreferences => ({
  profileId,
  calendarView: defaultView,
  updatedAt: new Date().toISOString(),
});

export const useUserPreferences = ({
  profileId,
  defaultView,
}: UseUserPreferencesArgs): UserPreferences | undefined =>
  useLiveQuery<UserPreferences | undefined>(async () => {
    if (!profileId) return undefined;
    const persisted = await db
      .table<UserPreferences>("userPreferences")
      .get(profileId);
    return persisted ?? synthesizeDefault(profileId, defaultView);
  }, [profileId, defaultView]);
