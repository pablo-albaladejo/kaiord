/**
 * Helpers for `useCoachingDialog`. Lives in its own file so the parent
 * hook stays under the line caps.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { ActivityMatchState } from "../../../hooks/use-activity-match-state";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type {
  ExpandActivity,
  ExpandFailureReason,
} from "../../../types/coaching-expand-result";
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
  const capturedForId = useRef<string | null>(null);
  useEffect(() => {
    if (!activity) {
      setTargetProfileId(null);
      capturedForId.current = null;
      return;
    }
    if (capturedForId.current === activity.id) return;
    capturedForId.current = activity.id;
    setTargetProfileId(activeProfileId);
  }, [activity, activeProfileId]);
  return targetProfileId;
};

export type DescriptionLoad = {
  /** Failure reason when the lazy fetch failed; `null` while loading or done. */
  reason: ExpandFailureReason | null;
  /** Re-fire the fetch (wired to the "Retry" button in the error state). */
  retry: () => void;
};

/**
 * Lazy-load the activity description on dialog open. Skipped when the
 * description is already known (including known-empty `""`). Auto-fires
 * once per activity id; a failed fetch surfaces `reason` so the dialog can
 * render a retryable error instead of hanging on "Loading description…".
 */
export const useExpandActivityOnOpen = (
  activity: CoachingActivity | null,
  expandActivity: ExpandActivity
): DescriptionLoad => {
  const activeProfileId = useActiveProfileLive()?.id ?? null;
  const [reason, setReason] = useState<ExpandFailureReason | null>(null);
  const mounted = useRef(true);
  const firedFor = useRef<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!activity || !activeProfileId) return;
    if (activity.description !== undefined) return;
    setReason(null);
    const result = await expandActivity(activity);
    if (mounted.current && result && !result.ok) setReason(result.reason);
  }, [activity, activeProfileId, expandActivity]);

  useEffect(() => {
    if (!activity) {
      firedFor.current = null;
      setReason(null);
      return;
    }
    if (activity.description !== undefined) return;
    if (firedFor.current === activity.id) return;
    firedFor.current = activity.id;
    void run();
  }, [activity, run]);

  return { reason, retry: run };
};
