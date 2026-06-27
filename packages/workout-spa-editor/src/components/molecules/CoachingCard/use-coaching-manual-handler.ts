/**
 * Manual-create handler for the coaching dialog (per design D4).
 *
 * "Edit manually" NO LONGER persists on click (defer-coaching-create):
 * it navigates to a store-only draft editor and persistence happens only
 * on an explicit Save (mirroring the scratch flow). First it checks for
 * an already-matched workout with the SAME idempotency key as the persist
 * path; if one exists it opens that `/workout/:id`, otherwise it opens a
 * fresh draft at `/workout/new?coaching=<profileId>:<activity.id>`.
 */
import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";

import { usePersistence } from "../../../contexts/persistence-context";
import { withOrigin } from "../../../routing/with-origin";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { namespaceSourceId } from "../../../types/coaching-activity-record";

export type UseCoachingManual = {
  creating: boolean;
  error: string | null;
  clearError: () => void;
  startManual: () => Promise<void>;
};

export const useCoachingManual = (
  activity: CoachingActivity | null,
  profileId: string | null,
  onClose: () => void,
  expandActivity: (activity: CoachingActivity) => void
): UseCoachingManual => {
  const persistence = usePersistence();
  const [, navigate] = useLocation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const startManual = useCallback(async () => {
    if (!activity || !profileId || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setCreating(true);
    try {
      // Prefetch the coach description before building the draft when it has
      // not loaded yet (weekly sync carries none) so the draft/Save path
      // captures it as the workout-level note. Awaiting closes the race with
      // the fire-and-forget on-open expand. Best-effort: a transport failure
      // must not block the draft (it just opens without the description).
      if (activity.description === undefined) {
        try {
          await expandActivity(activity);
        } catch {
          // ignore — proceed to the draft without the description
        }
      }
      // Idempotency: if a workout already exists for this activity (same
      // key the Save path guards on), open it instead of a fresh draft.
      // `activity.id` is the SHORT `${source}:${sourceId}`; strip the known
      // `${source}:` prefix (sourceId itself may contain `:`).
      const sourceId = activity.id.slice(activity.source.length + 1);
      const ns = namespaceSourceId(profileId, sourceId);
      const existing = await persistence.workouts.getBySourceId(
        activity.source,
        ns
      );
      onClose();
      if (existing) {
        navigate(withOrigin(`/workout/${existing.id}`, "coaching"));
        return;
      }
      // The draft route carries the composite id `coaching.getById` keys
      // on (`${profileId}:${source}:${sourceId}`); `activity.id` is the
      // SHORT form so prefix the profileId once.
      navigate(
        withOrigin(
          `/workout/new?coaching=${profileId}:${activity.id}`,
          "coaching"
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manual creation failed");
    } finally {
      setCreating(false);
      inFlight.current = false;
    }
  }, [activity, profileId, persistence, navigate, onClose, expandActivity]);

  return {
    creating,
    error,
    clearError: () => setError(null),
    startManual,
  };
};
