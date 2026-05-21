/**
 * Wires the `setCalendarView` use case with Dexie-backed adapters
 * and an injected clock. Returned callback persists the view and
 * the live-query subscription on the underlying user_preferences
 * table re-fires the consuming components.
 *
 * Lives in the hooks layer so components don't reach across into
 * adapters directly — preserves the layering enforced by the eslint
 * boundary rule.
 */

import { useCallback } from "react";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUserPreferencesRepository } from "../adapters/dexie/dexie-user-preferences-repository";
import { setCalendarView } from "../application/set-calendar-view";
import type { CalendarView } from "../types/user-preferences";

export function useSetCalendarView(profileId: string | null) {
  return useCallback(
    async (next: CalendarView): Promise<void> => {
      if (!profileId) return;
      const persistence = createDexiePersistence(db);
      await setCalendarView(
        { profileId, view: next },
        {
          clock: () => new Date().toISOString(),
          repository: createDexieUserPreferencesRepository(db),
          profileRepository: persistence.profiles,
        }
      );
    },
    [profileId]
  );
}
