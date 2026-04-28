/**
 * Hook backing CoachingActivityDialog: lazy description load + convert.
 *
 * Captures `targetProfileId` on dialog open so a profile switch while the
 * dialog is open does NOT redirect the conversion to the wrong profile.
 * The convert flow itself lives in `useCoachingConvert` (extracted to
 * keep this hook under the lint size limit).
 */

import { useEffect, useState } from "react";

import { useCoachingSourceFactories } from "../../../contexts/coaching-registry-context";
import { useActiveProfile } from "../../../hooks/use-active-profile";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useCoachingConvert } from "./use-coaching-convert";

export type UseCoachingDialog = {
  error: string | null;
  converting: boolean;
  handleConvert: () => Promise<void>;
};

export const useCoachingDialog = (
  activity: CoachingActivity | null,
  onClose: () => void
): UseCoachingDialog => {
  const { id: activeProfileId } = useActiveProfile();
  const factories = useCoachingSourceFactories();
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
    const sources = factories.map((f) => f(activeProfileId, []));
    const source = sources.find((s) => s.id === activity.source);
    void source?.expand(activeProfileId, activity.date);
  }, [activity, activeProfileId, factories]);

  const { error, converting, handleConvert } = useCoachingConvert(
    activity,
    targetProfileId,
    onClose
  );

  return { error, converting, handleConvert };
};
