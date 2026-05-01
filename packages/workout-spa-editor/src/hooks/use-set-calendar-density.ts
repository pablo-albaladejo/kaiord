/**
 * Wires the `setCalendarDensity` use case with Dexie-backed adapters
 * and an injected clock. Returned callback persists the density and
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
import { setCalendarDensity } from "../application/set-calendar-density";
import type { CalendarDensity } from "../types/user-preferences";

export function useSetCalendarDensity(profileId: string | null) {
  return useCallback(
    async (next: CalendarDensity): Promise<void> => {
      if (!profileId) return;
      const persistence = createDexiePersistence(db);
      await setCalendarDensity(
        { profileId, density: next },
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
