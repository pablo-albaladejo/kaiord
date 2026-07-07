/**
 * Reads and writes the F5 dashboard's pinned-parameter selection
 * (`userPreferences.labDashboardParams`), persisted per profile with no
 * new Dexie version — an optional, unindexed field (OQ2/S3). Reuses the
 * existing `userPreferences` read/write hooks rather than a dedicated
 * repo path.
 */
import { useSetUserPreferenceFields } from "../../../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../../../hooks/use-user-preferences";
import { toggleDashboardParam } from "./lab-dashboard-selection";

export const useLabDashboardParams = (profileId: string | null) => {
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setFields = useSetUserPreferenceFields(profileId);
  const pinned = prefs?.labDashboardParams ?? [];

  const toggle = (parameterKey: string): Promise<void> =>
    setFields({
      labDashboardParams: toggleDashboardParam(pinned, parameterKey),
    });

  return { pinned, toggle, loading: prefs === undefined };
};
