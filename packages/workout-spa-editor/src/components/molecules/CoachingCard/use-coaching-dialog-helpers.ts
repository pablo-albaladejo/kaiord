/**
 * Helpers for `useCoachingDialog`. Lives in its own file so the parent
 * hook stays under the line caps.
 */
import { useEffect, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { ActivityMatchState } from "../../../hooks/use-activity-match-state";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export const toMatchState = (
  s: CoachingDialogState | undefined
): ActivityMatchState | undefined => {
  if (!s) return undefined;
  if (s.kind === "matched")
    return { kind: "matched", matchId: s.matchId, workout: s.workout };
  return { kind: "solo" };
};

/**
 * Capture the active profile id when the dialog opens. A profile switch
 * while the dialog is open MUST NOT reroute writes — mirrors the
 * `linkAccount` pattern.
 */
export const useTargetProfileId = (
  activity: CoachingActivity | null
): string | null => {
  const activeProfileId = useActiveProfileLive()?.id ?? null;
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  useEffect(() => {
    if (!activity) {
      setTargetProfileId(null);
      return;
    }
    setTargetProfileId((prev) => prev ?? activeProfileId);
  }, [activity, activeProfileId]);
  return targetProfileId;
};

/**
 * Lazy-load the activity description on dialog open. Skipped when the
 * description is already known (including known-empty `""`).
 */
export const useExpandActivityOnOpen = (
  activity: CoachingActivity | null,
  expandActivity: (activity: CoachingActivity) => void
): void => {
  const activeProfileId = useActiveProfileLive()?.id ?? null;
  useEffect(() => {
    if (!activity || !activeProfileId) return;
    if (activity.description !== undefined) return;
    expandActivity(activity);
  }, [activity, activeProfileId, expandActivity]);
};
