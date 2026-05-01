/**
 * Hook backing CoachingActivityDialog: lazy description load + convert.
 *
 * Captures `targetProfileId` on dialog open so a profile switch while the
 * dialog is open does NOT redirect the conversion to the wrong profile.
 * The convert flow itself lives in `useCoachingConvert` (extracted to
 * keep this hook under the lint size limit).
 *
 * The dialog does NOT consume the coaching-source registry directly —
 * the host page (CalendarPage via useCoachingActivities) materializes
 * sources once and passes an opaque `expandActivity` callback. Lifting
 * the registry coupling out is a Rules-of-Hooks invariant: factories are
 * themselves React hooks and must be invoked at the top of a component
 * or hook body, not inside a useEffect or Array.map.
 */

import { useEffect, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useCoachingConvert } from "./use-coaching-convert";

export type UseCoachingDialog = {
  error: string | null;
  converting: boolean;
  handleConvert: () => Promise<void>;
};

export const useCoachingDialog = (
  activity: CoachingActivity | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingDialog => {
  const activeProfileId = useActiveProfileLive()?.id ?? null;
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!activity) {
      setTargetProfileId(null);
      return;
    }
    setTargetProfileId((prev) => prev ?? activeProfileId);
  }, [activity, activeProfileId]);

  useEffect(() => {
    if (!activity || !activeProfileId) return;
    if (activity.description !== undefined) return;
    expandActivity(activity);
  }, [activity, activeProfileId, expandActivity]);

  const { error, converting, handleConvert } = useCoachingConvert(
    activity,
    targetProfileId,
    onClose
  );

  return { error, converting, handleConvert };
};
