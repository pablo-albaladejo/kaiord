/**
 * Wires the `setUserPreferenceFields` use case with Dexie-backed
 * adapters and an injected clock. Returned callback persists the
 * partial patch onto the per-profile UserPreferences row; the
 * underlying live-query subscription re-fires the consuming
 * components.
 */

import { useCallback } from "react";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUserPreferencesRepository } from "../adapters/dexie/dexie-user-preferences-repository";
import {
  setUserPreferenceFields,
  type UserPreferenceFieldsPatch,
} from "../application/set-user-preference-fields";

export function useSetUserPreferenceFields(profileId: string | null) {
  return useCallback(
    async (patch: UserPreferenceFieldsPatch): Promise<void> => {
      if (!profileId) return;
      const persistence = createDexiePersistence(db);
      await setUserPreferenceFields(
        { profileId, patch },
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
