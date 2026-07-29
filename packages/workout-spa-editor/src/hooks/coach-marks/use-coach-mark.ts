/**
 * `useCoachMark` — decides which coach mark, if any, is relevant right now.
 *
 * Availability and the action both come from `useEditorCommands`, so a mark
 * can never offer something the keyboard shortcut would refuse: a mark is a
 * second surface for an existing command, never a second implementation.
 *
 * Dismissal is per profile in the cloud-synced preferences row, so a tip
 * taught on the laptop is not re-taught on the phone.
 */

import { useCallback, useMemo } from "react";

import type { ActiveCoachMark, CoachMarkId } from "../../lib/coach-marks";
import { pickCoachMark } from "../../lib/coach-marks";
import { logger } from "../../utils/logger";
import { useActiveProfileLive } from "../use-active-profile-live";
import { useEditorCommands } from "../use-editor-commands";
import { useSetUserPreferenceFields } from "../use-set-user-preference-fields";
import { useUserPreferences } from "../use-user-preferences";

export type CoachMarkState = {
  readonly mark: ActiveCoachMark | null;
  /** Runs the underlying editor command, then retires the mark. */
  readonly accept: () => void;
  /** Retires the mark without running anything. */
  readonly dismiss: () => void;
};

export function useCoachMark(): CoachMarkState {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  // `defaultView` only shapes the synthesised fallback row's calendar field,
  // which this hook never reads.
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const { commands, selectedStepId, selectedStepIds } = useEditorCommands();

  // Memoised: the fallback would be a fresh array on every render, and it is a
  // dependency of both the mark selection and the retire callback.
  const dismissed = useMemo(
    () => prefs?.dismissedCoachMarks ?? [],
    [prefs?.dismissedCoachMarks]
  );
  const mark = useMemo(
    () =>
      pickCoachMark({
        available: commands.filter((c) => c.enabled).map((c) => c.id),
        anchors: {
          // The last step the user added to the selection is the one their
          // attention is on, and it is the node the registry can resolve.
          "create-block": selectedStepIds.at(-1) ?? null,
          "ungroup-block": selectedStepId,
        },
        dismissed,
      }),
    [commands, selectedStepId, selectedStepIds, dismissed]
  );

  const retire = useCallback(
    (id: CoachMarkId) => {
      void setPrefs({
        dismissedCoachMarks: [...new Set([...dismissed, id])],
      }).catch((error: unknown) => {
        logger.warn("Failed to persist coach-mark dismissal", { error });
      });
    },
    [setPrefs, dismissed]
  );

  const run = commands.find((c) => c.id === mark?.id)?.run;

  return {
    mark,
    accept: useCallback(() => {
      if (!mark) return;
      retire(mark.id);
      run?.();
    }, [mark, retire, run]),
    dismiss: useCallback(() => {
      if (mark) retire(mark.id);
    }, [mark, retire]),
  };
}
