/**
 * Resolves every settings row that runs something instead of navigating.
 * Mirrors `useSettingsRowValues`: the row registry only names a
 * `SettingsActionKey`, and the behaviour stays behind the surface that owns
 * the state it touches.
 */

import { useCallback } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { logger } from "../../../utils/logger";
import type { SettingsActionKey } from "./settings-group-types";

export type SettingsRowActions = Record<SettingsActionKey, () => void>;

export const useSettingsRowActions = (): SettingsRowActions => {
  const active = useActiveProfileLive();
  const setPrefs = useSetUserPreferenceFields(active?.id ?? null);

  // Emptied, not deleted: an explicit `[]` is the same "nothing dismissed"
  // state a profile that never saw a mark is in.
  const replayCoachMarks = useCallback(() => {
    void setPrefs({ dismissedCoachMarks: [] }).catch((error: unknown) => {
      logger.warn("Failed to reset coach marks", { error });
    });
  }, [setPrefs]);

  return { replayCoachMarks };
};
