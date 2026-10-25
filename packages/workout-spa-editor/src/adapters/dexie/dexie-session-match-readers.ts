import type { Table } from "dexie";

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { SessionMatch } from "../../types/session-match";

export const buildReaders = (
  table: () => Table<SessionMatch>
): Pick<
  SessionMatchRepository,
  | "getById"
  | "getByActivityId"
  | "getByWorkoutId"
  | "listByProfileAndWeek"
  | "listByActivityIds"
  | "listByProfile"
> => ({
  getById: async (id) => (await table().get(id)) ?? undefined,
  getByActivityId: async (profileId, coachingActivityId) =>
    (await table()
      .where("[profileId+coachingActivityId]")
      .equals([profileId, coachingActivityId])
      .first()) ?? undefined,
  getByWorkoutId: async (profileId, workoutId) =>
    (await table()
      .where("[profileId+workoutId]")
      .equals([profileId, workoutId])
      .first()) ?? undefined,
  listByProfileAndWeek: async (profileId, weekStart, weekEnd) =>
    table()
      .where("[profileId+date]")
      .between([profileId, weekStart], [profileId, weekEnd], true, true)
      .toArray(),
  listByActivityIds: async (profileId, coachingActivityIds) =>
    coachingActivityIds.length === 0
      ? []
      : table()
          .where("[profileId+coachingActivityId]")
          .anyOf(coachingActivityIds.map((id) => [profileId, id]))
          .toArray(),
  listByProfile: (profileId) =>
    table().where("profileId").equals(profileId).toArray(),
});
