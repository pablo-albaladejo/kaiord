/**
 * In-Memory SessionMatchRepository — read-side projection.
 *
 * Extracted from the main factory so the entry file stays under the
 * 100-line cap. Pure Map-scan implementations; no IO.
 */

import type { SessionMatchRepository } from "../ports/session-match-repository";
import type { SessionMatch } from "../types/session-match";

type Store = Map<string, SessionMatch>;

export const buildReaders = (
  store: Store
): Pick<
  SessionMatchRepository,
  "getById" | "getByActivityId" | "getByWorkoutId" | "listByProfileAndWeek"
> => ({
  getById: async (id) => store.get(id),
  getByActivityId: async (profileId, coachingActivityId) =>
    [...store.values()].find(
      (m) =>
        m.profileId === profileId && m.coachingActivityId === coachingActivityId
    ),
  getByWorkoutId: async (profileId, workoutId) =>
    [...store.values()].find(
      (m) => m.profileId === profileId && m.workoutId === workoutId
    ),
  listByProfileAndWeek: async (profileId, weekStart, weekEnd) =>
    [...store.values()].filter(
      (m) =>
        m.profileId === profileId && m.date >= weekStart && m.date <= weekEnd
    ),
});
