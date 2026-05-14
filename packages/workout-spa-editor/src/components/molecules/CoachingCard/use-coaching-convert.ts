import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { convertCoachingActivity } from "../../../application/coaching/convert-coaching-activity";
import { useAnalytics } from "../../../contexts";
import { usePersistence } from "../../../contexts/persistence-context";
import type { CoachingActivity } from "../../../types/coaching-activity";

const parseSourceId = (activity: CoachingActivity): string | null => {
  const prefix = `${activity.source}:`;
  return activity.id.startsWith(prefix)
    ? activity.id.slice(prefix.length)
    : null;
};

export type UseCoachingConvert = {
  error: string | null;
  converting: boolean;
  setError: (e: string | null) => void;
  handleConvert: () => Promise<void>;
};

export const useCoachingConvert = (
  activity: CoachingActivity | null,
  targetProfileId: string | null,
  onClose: () => void
): UseCoachingConvert => {
  const persistence = usePersistence();
  const analytics = useAnalytics();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handleConvert = useCallback(async () => {
    if (!activity || !targetProfileId) return;
    analytics.event("coaching.convert.invoked", { source: activity.source });
    setError(null);
    setConverting(true);
    try {
      const sourceId = parseSourceId(activity);
      if (!sourceId) {
        setError("Invalid activity id");
        return;
      }
      const record = await persistence.coaching.getByProfileAndSourceId(
        targetProfileId,
        activity.source,
        sourceId
      );
      if (!record) {
        setError("Activity not found");
        return;
      }
      const result = await convertCoachingActivity(
        { coaching: persistence.coaching, workouts: persistence.workouts },
        record.id
      );
      if (!result.created) {
        analytics.event("coaching.convert.idempotent_hit", {
          source: activity.source,
        });
      }
      onClose();
      navigate(`/workout/${result.workoutId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  }, [activity, targetProfileId, analytics, persistence, navigate, onClose]);

  return { error, converting, setError, handleConvert };
};
