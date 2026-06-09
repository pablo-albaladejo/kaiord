/**
 * useCoachingDraft — store-only coaching draft for
 * `/workout/new?coaching=<compositeId>`.
 *
 * Reads the coaching activity by its composite id (reactive via
 * `useLiveQuery`, like `use-coaching-sidebar`), derives the seed KRD via
 * `buildCoachingDraftKrd`, and seeds the workout-store ONCE (guarded like
 * `use-workout-record` / `ScratchEditorSurface` so user edits are never
 * clobbered by a re-seed). Nothing is persisted — Save does that.
 *
 * A rest day or unknown sport (`resolveT2GSport === null`) yields no
 * draft KRD; the caller shows the no-structured-workout state while still
 * exposing the activity for the sidebar.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { buildCoachingDraftKrd } from "../../application/coaching/build-coaching-draft-krd";
import { useLoadWorkout } from "../../store/selectors/workout-selectors";
import { useCurrentWorkout } from "../../store/selectors/workout-selectors";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";

export type CoachingDraftState = {
  activity: CoachingActivityRecord | undefined;
  /** true once the activity row resolved but yields no trainable KRD. */
  noStructured: boolean;
};

export function useCoachingDraft(
  coachingDraftId: string | null
): CoachingDraftState {
  const activity = useLiveQuery(
    () =>
      coachingDraftId
        ? db
            .table<CoachingActivityRecord>("coachingActivities")
            .get(coachingDraftId)
        : undefined,
    [coachingDraftId]
  );

  const loadWorkout = useLoadWorkout();
  const currentWorkout = useCurrentWorkout();
  const seededRef = useRef(false);

  useEffect(() => {
    if (!activity || seededRef.current) return;
    // Seed-once guard: never re-seed over user edits already in the store.
    if (currentWorkout !== null) {
      seededRef.current = true;
      return;
    }
    const draft = buildCoachingDraftKrd(activity);
    seededRef.current = true;
    if (!draft) return;
    loadWorkout(draft.krd);
  }, [activity, currentWorkout, loadWorkout]);

  const noStructured =
    activity !== undefined && buildCoachingDraftKrd(activity) === null;

  return { activity, noStructured };
}
