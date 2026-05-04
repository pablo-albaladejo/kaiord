import { describe, expect, it } from "vitest";

import type { CoachingRepository } from "../ports/persistence-port";
import type { WorkoutRepository } from "../ports/persistence-port";
import { createInMemorySessionMatchRepository } from "../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import {
  CoachingActivityNotFoundError,
  CrossProfileMatchError,
  SessionAlreadyMatchedError,
  WorkoutNotFoundError,
} from "../types/session-match-errors";
import { matchSession } from "./match-session";

const stubActivity = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => ({
  id: "p1:train2go:12345",
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-29",
  sport: "cycling",
  title: "FTP test",
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
  ...overrides,
});

const stubWorkout = (
  overrides: Partial<WorkoutRecord> = {}
): WorkoutRecord => ({
  id: "w-abc",
  date: "2026-04-29",
  state: "ready",
  source: "train2go",
  sport: "cycling",
  ...overrides,
});

const stubCoachingRepo = (
  rows: CoachingActivityRecord[] = []
): CoachingRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByProfileAndDateRange: async () => [...map.values()],
    getByProfileAndSourceId: async () => undefined,
    upsertMany: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
    deleteByProfile: async () => undefined,
  };
};

const stubWorkoutRepo = (rows: WorkoutRecord[] = []): WorkoutRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByDateRange: async () => [...map.values()],
    getByState: async () => [],
    getBySourceId: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
  };
};

const fixedClock = () => "2026-05-01T12:00:00.000Z";
const fixedId = () => "M1";

describe("matchSession", () => {
  it("should write a SessionMatch with injected clock and idGenerator", async () => {
    const activity = stubActivity();
    const workout = stubWorkout();
    const repo = createInMemorySessionMatchRepository();

    const result = await matchSession(
      {
        profileId: "p1",
        coachingActivityId: activity.id,
        workoutId: workout.id,
      },
      {
        clock: fixedClock,
        idGenerator: fixedId,
        repository: repo,
        coachingRepository: stubCoachingRepo([activity]),
        workoutRepository: stubWorkoutRepo([workout]),
      }
    );

    expect(result).toEqual({
      id: "M1",
      profileId: "p1",
      coachingActivityId: activity.id,
      workoutId: workout.id,
      date: activity.date,
      createdAt: "2026-05-01T12:00:00.000Z",
      source: "manual",
    });
    expect(await repo.getByActivityId("p1", activity.id)).toEqual(result);
  });

  it("should use explicit source when provided", async () => {
    const activity = stubActivity();
    const workout = stubWorkout();

    const result = await matchSession(
      {
        profileId: "p1",
        coachingActivityId: activity.id,
        workoutId: workout.id,
        source: "auto-conversion",
      },
      {
        clock: fixedClock,
        idGenerator: fixedId,
        repository: createInMemorySessionMatchRepository(),
        coachingRepository: stubCoachingRepo([activity]),
        workoutRepository: stubWorkoutRepo([workout]),
      }
    );

    expect(result.source).toBe("auto-conversion");
  });

  it("should throw CoachingActivityNotFoundError when the activity is missing", async () => {
    await expect(
      matchSession(
        {
          profileId: "p1",
          coachingActivityId: "missing",
          workoutId: "w-abc",
        },
        {
          clock: fixedClock,
          idGenerator: fixedId,
          repository: createInMemorySessionMatchRepository(),
          coachingRepository: stubCoachingRepo([]),
          workoutRepository: stubWorkoutRepo([stubWorkout()]),
        }
      )
    ).rejects.toBeInstanceOf(CoachingActivityNotFoundError);
  });

  it("should throw CrossProfileMatchError when the activity belongs to a different profile", async () => {
    const activity = stubActivity({
      id: "p2:train2go:12345",
      profileId: "p2",
    });
    const workout = stubWorkout();

    await expect(
      matchSession(
        {
          profileId: "p1",
          coachingActivityId: activity.id,
          workoutId: workout.id,
        },
        {
          clock: fixedClock,
          idGenerator: fixedId,
          repository: createInMemorySessionMatchRepository(),
          coachingRepository: stubCoachingRepo([activity]),
          workoutRepository: stubWorkoutRepo([workout]),
        }
      )
    ).rejects.toBeInstanceOf(CrossProfileMatchError);
  });

  it("should throw WorkoutNotFoundError when the workout is missing", async () => {
    const activity = stubActivity();

    await expect(
      matchSession(
        {
          profileId: "p1",
          coachingActivityId: activity.id,
          workoutId: "missing-workout",
        },
        {
          clock: fixedClock,
          idGenerator: fixedId,
          repository: createInMemorySessionMatchRepository(),
          coachingRepository: stubCoachingRepo([activity]),
          workoutRepository: stubWorkoutRepo([]),
        }
      )
    ).rejects.toBeInstanceOf(WorkoutNotFoundError);
  });

  it("should propagate SessionAlreadyMatchedError from the repository", async () => {
    const activity = stubActivity();
    const workout = stubWorkout();
    const repo = createInMemorySessionMatchRepository();

    await matchSession(
      {
        profileId: "p1",
        coachingActivityId: activity.id,
        workoutId: workout.id,
      },
      {
        clock: fixedClock,
        idGenerator: () => "M1",
        repository: repo,
        coachingRepository: stubCoachingRepo([activity]),
        workoutRepository: stubWorkoutRepo([workout]),
      }
    );

    await expect(
      matchSession(
        {
          profileId: "p1",
          coachingActivityId: activity.id,
          workoutId: "w-other",
        },
        {
          clock: fixedClock,
          idGenerator: () => "M2",
          repository: repo,
          coachingRepository: stubCoachingRepo([activity]),
          workoutRepository: stubWorkoutRepo([stubWorkout({ id: "w-other" })]),
        }
      )
    ).rejects.toBeInstanceOf(SessionAlreadyMatchedError);
  });

  it("should permit the same workout matched in two profiles", async () => {
    const a1 = stubActivity({ id: "p1:train2go:1", profileId: "p1" });
    const a2 = stubActivity({ id: "p2:train2go:1", profileId: "p2" });
    const w = stubWorkout({ id: "w-shared" });
    const repo = createInMemorySessionMatchRepository();

    await matchSession(
      { profileId: "p1", coachingActivityId: a1.id, workoutId: w.id },
      {
        clock: fixedClock,
        idGenerator: () => "M-p1",
        repository: repo,
        coachingRepository: stubCoachingRepo([a1]),
        workoutRepository: stubWorkoutRepo([w]),
      }
    );

    await expect(
      matchSession(
        { profileId: "p2", coachingActivityId: a2.id, workoutId: w.id },
        {
          clock: fixedClock,
          idGenerator: () => "M-p2",
          repository: repo,
          coachingRepository: stubCoachingRepo([a2]),
          workoutRepository: stubWorkoutRepo([w]),
        }
      )
    ).resolves.toMatchObject({ id: "M-p2", profileId: "p2" });
  });
});
