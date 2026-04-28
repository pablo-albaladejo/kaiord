/**
 * Hook backing CoachingActivityDialog: lazy description load + convert.
 * Extracted to keep the dialog component under the lint size limit.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import { convertCoachingActivity } from "../../../application/coaching/convert-coaching-activity";
import { useCoachingSourceFactories } from "../../../contexts/coaching-registry-context";
import { usePersistence } from "../../../contexts/persistence-context";
import { useActiveProfile } from "../../../hooks/use-active-profile";
import type { CoachingActivity } from "../../../types/coaching-activity";

export type UseCoachingDialog = {
  error: string | null;
  converting: boolean;
  handleConvert: () => Promise<void>;
};

export const useCoachingDialog = (
  activity: CoachingActivity | null,
  onClose: () => void
): UseCoachingDialog => {
  const persistence = usePersistence();
  const { id: activeProfileId } = useActiveProfile();
  const factories = useCoachingSourceFactories();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!activity || !activeProfileId) return;
    if (activity.description !== undefined) return;
    const sources = factories.map((f) => f(activeProfileId, []));
    const source = sources.find((s) => s.id === activity.source);
    void source?.expand(activeProfileId, activity.date);
  }, [activity, activeProfileId, factories]);

  const handleConvert = async () => {
    if (!activity || !activeProfileId) return;
    setError(null);
    setConverting(true);
    try {
      const [, sourceId] = activity.id.split(":");
      const record = await persistence.coaching.getByProfileAndSourceId(
        activeProfileId,
        activity.source,
        sourceId ?? ""
      );
      if (!record) {
        setError("Activity not found");
        return;
      }
      const { workoutId } = await convertCoachingActivity(
        { coaching: persistence.coaching, workouts: persistence.workouts },
        record.id
      );
      onClose();
      navigate(`/workout/${workoutId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  return { error, converting, handleConvert };
};
