import { useCallback, useMemo } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import { logger } from "../../../utils/logger";

export const DEFAULT_PROFILE_NOTICE_ID = "default-profile-notice";

/**
 * Visible while the active profile is the unclaimed default one and the
 * notice was not dismissed. Dismissal is a preference write, never a
 * profile edit, so it does not claim the profile.
 */
export function useDefaultProfileNotice() {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const dismissed = useMemo(
    () => prefs?.dismissedCoachMarks ?? [],
    [prefs?.dismissedCoachMarks]
  );
  const visible =
    active?.profile?.origin === "auto" &&
    prefs !== undefined &&
    !dismissed.includes(DEFAULT_PROFILE_NOTICE_ID);

  const dismiss = useCallback(() => {
    void setPrefs({
      dismissedCoachMarks: [
        ...new Set([...dismissed, DEFAULT_PROFILE_NOTICE_ID]),
      ],
    }).catch((error: unknown) => {
      logger.warn("Failed to persist default-profile notice dismissal", {
        error,
      });
    });
  }, [setPrefs, dismissed]);

  return { visible, dismiss };
}
