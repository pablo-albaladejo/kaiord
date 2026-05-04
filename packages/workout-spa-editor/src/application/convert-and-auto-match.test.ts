import { describe, expect, it } from "vitest";

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../ports/persistence-port";
import type { SessionMatchRepository } from "../ports/session-match-repository";
import { createInMemorySessionMatchRepository } from "../test-utils/in-memory-session-match-repository";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import {
  CoachingActivityNotFoundError,
  SessionAlreadyMatchedError,
} from "../types/session-match-errors";
import { convertAndAutoMatch } from "./convert-and-auto-match";

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

const stubCoachingRepo = (
  rows: CoachingActivityRecord[]
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
  const store = new Map(rows.map((r) => [r.id, r]));
  let nextSourceLookup: WorkoutRecord | undefined;
  const repo: WorkoutRepository & {
    setSourceLookup: (w: WorkoutRecord | undefined) => void;
  } = {
    getById: async (id) => store.get(id),
    getByDateRange: async () => [...store.values()],
    getByState: async () => [],
    getBySourceId: async () => nextSourceLookup,
    put: async (w) => {
      store.set(w.id, w);
    },
    delete: async (id) => {
      store.delete(id);
    },
    setSourceLookup: (w) => {
      nextSourceLookup = w;
    },
  };
  return repo;
};

const fixedClock = () => "2026-05-01T12:00:00.000Z";

describe("convertAndAutoMatch", () => {
  it("should create workout AND SessionMatch with source: auto-conversion on first-time conversion", async () => {
    const activity = stubActivity();
    const coaching = stubCoachingRepo([activity]);
    const workouts = stubWorkoutRepo();
    const matches = createInMemorySessionMatchRepository();

    const result = await convertAndAutoMatch(
      { activityId: activity.id },
      {
        coaching,
        workouts,
        sessionMatches: matches,
        newWorkoutId: () => "w-new",
        newMatchId: () => "M-new",
        clock: fixedClock,
      }
    );

    expect(result.workoutId).toBe("w-new");
    expect(result.created).toBe(true);
    const match = await matches.getByActivityId("p1", activity.id);
    expect(match).toMatchObject({
      coachingActivityId: activity.id,
      workoutId: "w-new",
      source: "auto-conversion",
    });
  });

  it("should preserve existing match on idempotent re-conversion (no overwrite)", async () => {
    const activity = stubActivity();
    const existingWorkout: WorkoutRecord = {
      id: "w-existing",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
      state: "raw",
    } as WorkoutRecord;
    const coaching = stubCoachingRepo([activity]);
    const workouts = stubWorkoutRepo([existingWorkout]) as ReturnType<
      typeof stubWorkoutRepo
    > & { setSourceLookup: (w: WorkoutRecord | undefined) => void };
    workouts.setSourceLookup(existingWorkout);
    const matches = createInMemorySessionMatchRepository();
    const existingMatch: SessionMatch = {
      id: "M-existing",
      profileId: "p1",
      coachingActivityId: activity.id,
      workoutId: "w-existing",
      date: activity.date,
      createdAt: "2026-04-30T10:00:00.000Z",
      source: "manual",
    };
    await matches.put(existingMatch);

    const result = await convertAndAutoMatch(
      { activityId: activity.id },
      {
        coaching,
        workouts,
        sessionMatches: matches,
        newWorkoutId: () => "w-should-not-be-used",
        newMatchId: () => "M-should-not-be-used",
        clock: fixedClock,
      }
    );

    expect(result.workoutId).toBe("w-existing");
    expect(result.created).toBe(false);
    expect(await matches.getByActivityId("p1", activity.id)).toEqual(
      existingMatch
    );
  });

  it("should NOT recreate the match on re-conversion after manual unmatch", async () => {
    const activity = stubActivity();
    const existingWorkout: WorkoutRecord = {
      id: "w-was-matched",
      date: activity.date,
      sport: activity.sport,
      source: activity.source,
      state: "raw",
    } as WorkoutRecord;
    const coaching = stubCoachingRepo([activity]);
    const workouts = stubWorkoutRepo([existingWorkout]) as ReturnType<
      typeof stubWorkoutRepo
    > & { setSourceLookup: (w: WorkoutRecord | undefined) => void };
    workouts.setSourceLookup(existingWorkout);
    const matches = createInMemorySessionMatchRepository();

    const result = await convertAndAutoMatch(
      { activityId: activity.id },
      {
        coaching,
        workouts,
        sessionMatches: matches,
        newWorkoutId: () => "wont-use",
        newMatchId: () => "M-new",
        clock: fixedClock,
      }
    );

    expect(result.workoutId).toBe("w-was-matched");
    expect(await matches.getByWorkoutId("p1", "w-was-matched")).toBeUndefined();
  });

  it("should propagate CoachingActivityNotFoundError-equivalent when activity is missing", async () => {
    await expect(
      convertAndAutoMatch(
        { activityId: "missing" },
        {
          coaching: stubCoachingRepo([]),
          workouts: stubWorkoutRepo(),
          sessionMatches: createInMemorySessionMatchRepository(),
          newWorkoutId: () => "x",
          newMatchId: () => "y",
          clock: fixedClock,
        }
      )
    ).rejects.toBeInstanceOf(CoachingActivityNotFoundError);
  });

  it("should swallow SessionAlreadyMatchedError if a concurrent matcher wins the race", async () => {
    const activity = stubActivity();
    const coaching = stubCoachingRepo([activity]);
    const workouts = stubWorkoutRepo();
    const matches: SessionMatchRepository = {
      ...createInMemorySessionMatchRepository(),
      // Pre-check returns no match, but put throws (concurrent winner).
      getByActivityId: async () => undefined,
      getByWorkoutId: async () => undefined,
      put: async () => {
        throw new SessionAlreadyMatchedError("concurrent");
      },
    };

    const result = await convertAndAutoMatch(
      { activityId: activity.id },
      {
        coaching,
        workouts,
        sessionMatches: matches,
        newWorkoutId: () => "w-new",
        newMatchId: () => "M-new",
        clock: fixedClock,
      }
    );

    expect(result.workoutId).toBe("w-new");
    expect(result.created).toBe(true);
  });
});
