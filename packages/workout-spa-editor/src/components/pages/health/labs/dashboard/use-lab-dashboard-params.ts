/**
 * Reads and writes the F5 dashboard's pinned-parameter selection
 * (`userPreferences.labDashboardParams`), persisted per profile with no
 * new Dexie version — an optional, unindexed field (OQ2/S3).
 *
 * Writes go through `toggleLabDashboardParam`, which reads the current
 * persisted selection instead of trusting the rendered snapshot, and are
 * serialized through a local queue so rapid pin/unpin clicks cannot
 * interleave their read/write pairs and drop a pin.
 */
import { useCallback, useRef } from "react";

import { db } from "../../../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../../../adapters/dexie/dexie-persistence-adapter";
import { createDexieUserPreferencesRepository } from "../../../../../adapters/dexie/dexie-user-preferences-repository";
import { toggleLabDashboardParam } from "../../../../../application/lab/toggle-lab-dashboard-param.use-case";
import { useUserPreferences } from "../../../../../hooks/use-user-preferences";

export const useLabDashboardParams = (profileId: string | null) => {
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const pinned = prefs?.labDashboardParams ?? [];
  const queue = useRef<Promise<void>>(Promise.resolve());

  const toggle = useCallback(
    (parameterKey: string): Promise<void> => {
      if (!profileId) return Promise.resolve();
      const run = queue.current.then(() =>
        toggleLabDashboardParam(
          { profileId, parameterKey },
          {
            clock: () => new Date().toISOString(),
            repository: createDexieUserPreferencesRepository(db),
            profileRepository: createDexiePersistence(db).profiles,
          }
        )
      );
      queue.current = run.catch(() => undefined);
      return run;
    },
    [profileId]
  );

  return { pinned, toggle, loading: prefs === undefined };
};
