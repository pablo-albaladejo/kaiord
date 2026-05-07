/**
 * Emits `coaching.dialog.state_observed` exactly once per dialog open
 * (task §5.3). The ref is keyed by activity id so re-opening the dialog
 * for the same row after closing fires a fresh event.
 */
import { useEffect, useRef } from "react";

import { useAnalytics } from "../../../contexts/analytics-context";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CoachingDialogState } from "./use-coaching-dialog-state";

export const useCoachingDialogStateObserved = (
  activity: CoachingActivity | null,
  dialogState: CoachingDialogState | undefined
): void => {
  const analytics = useAnalytics();
  const lastFiredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!activity || !dialogState) return;
    const key = `${activity.id}:${dialogState.kind}`;
    if (lastFiredFor.current === key) return;
    lastFiredFor.current = key;
    analytics.event("coaching.dialog.state_observed", {
      kind: dialogState.kind,
    });
  }, [activity, dialogState, analytics]);

  useEffect(() => {
    if (!activity) lastFiredFor.current = null;
  }, [activity]);
};
