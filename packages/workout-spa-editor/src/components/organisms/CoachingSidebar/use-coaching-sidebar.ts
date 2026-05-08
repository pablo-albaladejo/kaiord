/**
 * useCoachingSidebar — resolves whether the EditorPage workout is
 * derived from a coaching activity and, if so, returns the live
 * `CoachingActivityRecord` so the sidebar can render the prescription
 * alongside the editor.
 *
 * Reactive: when the bridge re-syncs the description, the underlying
 * Dexie row update flows through `useLiveQuery` and the sidebar
 * re-renders automatically (per task §9.5).
 *
 * The two reads are intentionally separate: the SessionMatch lookup
 * keys on `(profileId, workoutId)`; the CoachingActivity lookup keys
 * on the match's `coachingActivityId`. A workout without a coaching
 * match returns `undefined`, which the EditorPage treats as "no
 * sidebar to render".
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import type { CoachingActivityRecord } from "../../../types/coaching-activity-record";
import type { SessionMatch } from "../../../types/session-match";

export type CoachingSidebarData = {
  match: SessionMatch;
  activity: CoachingActivityRecord;
};

const COACHING_SOURCES: ReadonlyArray<SessionMatch["source"]> = [
  "auto-coaching",
  "auto-coaching-v10-migration",
  "manual",
];

const resolveSidebar = async (
  profileId: string,
  workoutId: string
): Promise<CoachingSidebarData | undefined> => {
  const match = await db
    .table<SessionMatch>("sessionMatches")
    .where("[profileId+workoutId]")
    .equals([profileId, workoutId])
    .first();
  if (!match) return undefined;
  if (!COACHING_SOURCES.includes(match.source)) return undefined;
  const activity = await db
    .table<CoachingActivityRecord>("coachingActivities")
    .get(match.coachingActivityId);
  if (!activity) return undefined;
  return { match, activity };
};

export const useCoachingSidebar = (
  profileId: string | null,
  workoutId: string | undefined
): CoachingSidebarData | undefined =>
  useLiveQuery<CoachingSidebarData | undefined>(async () => {
    if (!profileId || !workoutId) return undefined;
    return resolveSidebar(profileId, workoutId);
  }, [profileId, workoutId]);
