/**
 * Foundational Data Hub scenario (F5.3): with planned-session←train2go AND
 * activity←garmin both active, a pulled Garmin activity links to the planned
 * session's existing SessionMatch. Kill test: disabling activity←garmin stops
 * the pull entirely. Exercises the real use cases end to end over in-memory
 * repos (governed pull → persist → executed auto-match).
 */
import { describe, expect, it } from "vitest";

import { createInMemoryActivityRepository } from "../../test-utils/in-memory-activity-repository";
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { pullGarminActivities } from "../import/pull-garmin-activities.use-case";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { matchExecutedWorkouts } from "./match-executed-workouts";

const PROFILE = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-07-05";

const garminRoute = (enabled: boolean): IntegrationPolicy => ({
  id: "route-activity-garmin",
  profileId: PROFILE,
  dataType: "activity",
  bridgeId: "garmin-bridge",
  direction: "import",
  mode: "auto",
  enabled,
  updatedAt: "2026-07-06T00:00:00.000Z",
});

const policyRepo = (
  rows: IntegrationPolicy[]
): IntegrationPolicyRepository => ({
  findByProfileDirection: async ({ profileId, dataType, direction }) =>
    rows.filter(
      (r) =>
        r.profileId === profileId &&
        r.dataType === dataType &&
        r.direction === direction
    ),
  findByNaturalKey: async () => undefined,
  put: async () => undefined,
  deleteById: async () => undefined,
});

const syncStateRepo = () => ({
  getBySourceAndProfile: async () => undefined,
  put: async () => undefined,
  deleteByProfile: async () => undefined,
});

const garminActivity = () => ({
  activityId: 42_042,
  startTimeLocal: `${DAY} 07:30:00`,
  activityType: { typeKey: "cycling" },
  duration: 3600,
  distance: 30000,
});

const plannedWorkout = (): WorkoutRecord =>
  ({
    id: "w-planned-1",
    profileId: PROFILE,
    date: DAY,
    sport: "cycling",
    source: "train2go",
    state: "structured",
  }) as WorkoutRecord;

const canonical = (raw: string): string | null =>
  ["bike", "cycling"].includes(raw.toLowerCase()) ? "cycling" : null;

describe("session-match garmin activity (F5.3 foundational scenario)", () => {
  it("should link a pulled garmin activity to the planned session's match", async () => {
    // Arrange
    const store = new Map<string, ActivityRecord>();
    const activities = createInMemoryActivityRepository(store);
    const deps = {
      policyRepo: policyRepo([garminRoute(true)]),
      activities,
      coachingSyncState: syncStateRepo(),
      readActivities: async () => ({
        activities: [garminActivity()],
        disabled: false,
        throttled: false,
      }),
      now: () => "2026-07-07T00:00:00.000Z",
    };

    // Act
    // Governed pull persists the activity, then the executed match runs.
    const pull = await pullGarminActivities(deps, PROFILE);
    const persisted = await activities.getByProfileAndDateRange(
      PROFILE,
      DAY,
      DAY
    );
    const appends = matchExecutedWorkouts({
      sessionMatches: [
        {
          id: "m-1",
          profileId: PROFILE,
          coachingActivityId: `${PROFILE}:train2go:1`,
          workoutId: "w-planned-1",
          date: DAY,
          createdAt: "2026-07-04T10:00:00.000Z",
          source: "auto-coaching",
          executedWorkoutIds: [],
        },
      ],
      workouts: [plannedWorkout()],
      activities: persisted,
      canonicalSport: canonical,
    });

    // Assert
    expect(pull).toMatchObject({ ok: true, imported: 1 });
    expect(persisted).toHaveLength(1);
    expect(appends).toEqual([{ matchId: "m-1", toAppend: [persisted[0]!.id] }]);
  });

  it("should stop the pull when the activity garmin route is disabled (kill test)", async () => {
    // Arrange
    const store = new Map<string, ActivityRecord>();
    let fetched = false;
    const deps = {
      policyRepo: policyRepo([garminRoute(false)]),
      activities: createInMemoryActivityRepository(store),
      coachingSyncState: syncStateRepo(),
      readActivities: async () => {
        fetched = true;
        return {
          activities: [garminActivity()],
          disabled: false,
          throttled: false,
        };
      },
    };

    // Act
    const pull = await pullGarminActivities(deps, PROFILE);

    // Assert
    expect(pull).toEqual({ ok: false, reason: "route-inactive" });
    expect(fetched).toBe(false);
    expect(store.size).toBe(0);
  });
});
