import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexieMatchedSessionsReadModel } from "../adapters/dexie/dexie-matched-sessions-read-model";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";
import { hydrateMatchedSessions } from "./use-matched-sessions-hydrate";

const readModel = createDexieMatchedSessionsReadModel(db);

const PROFILE = "p1";
const SOURCE = "train2go";
const RAW_SOURCE_ID = "12345";
const COMPOSITE = buildCoachingActivityId(PROFILE, SOURCE, RAW_SOURCE_ID);
const SHORT = `${SOURCE}:${RAW_SOURCE_ID}`;
const DATE = "2026-04-29";

const seedActivity = (): CoachingActivityRecord => ({
  id: COMPOSITE,
  profileId: PROFILE,
  source: SOURCE,
  sourceId: RAW_SOURCE_ID,
  date: DATE,
  sport: "cycling",
  title: "FTP test",
  duration: "60 min",
  status: "pending",
  fetchedAt: "2026-04-28T10:00:00.000Z",
});

const seedWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-1",
    date: DATE,
    sport: "cycling",
    source: SOURCE,
    sourceId: namespaceSourceId(PROFILE, RAW_SOURCE_ID),
    state: "structured",
    krd: null,
    raw: { duration: { value: 3600, unit: "s" } },
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-28T10:00:00.000Z",
    updatedAt: "2026-04-28T10:00:00.000Z",
    modifiedAt: null,
    planId: null,
    ...overrides,
  }) as WorkoutRecord;

const seedMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: PROFILE,
  coachingActivityId: COMPOSITE,
  workoutId: "w-1",
  date: DATE,
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

const clearAll = (): Promise<unknown> =>
  Promise.all([
    db.table("sessionMatches").clear(),
    db.table("coachingActivities").clear(),
    db.table("workouts").clear(),
  ]);

describe("hydrateMatchedSessions", () => {
  beforeEach(clearAll);
  afterEach(clearAll);

  it("should hydrate a happy COMPOSITE-id match into a MatchedSessionWithMetadata", async () => {
    // Arrange
    await db.table("coachingActivities").put(seedActivity());
    await db.table("workouts").put(seedWorkout());
    const match = seedMatch();

    // Act
    const result = await hydrateMatchedSessions([match], readModel);

    // Assert
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]?.match.id).toBe("m-1");
    expect(result.matched[0]?.activity.id).toBe(SHORT);
    expect(result.matched[0]?.workout.id).toBe("w-1");
    expect(result.dangling).toEqual([]);
  });

  it("should drop a SHORT-form orphan match with a structured console.warn and surface it as dangling", async () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await db.table("coachingActivities").put(seedActivity());
    await db.table("workouts").put(seedWorkout());
    const orphan = seedMatch({ coachingActivityId: SHORT });

    // Act
    const result = await hydrateMatchedSessions([orphan], readModel);

    // Assert
    expect(result.matched).toEqual([]);
    expect(result.dangling).toEqual([{ match: orphan, hadWorkout: true }]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[matched-sessions] dropping match — dangling ref",
      {
        matchId: "m-1",
        coachingActivityId: SHORT,
        workoutId: "w-1",
        hadActivity: false,
        hadWorkout: true,
      }
    );
    warn.mockRestore();
  });

  it("should surface dangling with hadWorkout=false when the workout side is also missing", async () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await db.table("coachingActivities").put(seedActivity());
    const orphan = seedMatch({
      coachingActivityId: SHORT,
      workoutId: "w-missing",
    });

    // Act
    const result = await hydrateMatchedSessions([orphan], readModel);

    // Assert
    expect(result.matched).toEqual([]);
    expect(result.dangling).toEqual([{ match: orphan, hadWorkout: false }]);
    warn.mockRestore();
  });

  it("should mix hydrated and dropped matches in one pass without affecting the survivors", async () => {
    // Arrange
    await db.table("coachingActivities").put(seedActivity());
    await db.table("workouts").put(seedWorkout());
    const good = seedMatch();
    const orphan = seedMatch({
      id: "m-2",
      coachingActivityId: SHORT,
      workoutId: "w-1",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    // Act
    const result = await hydrateMatchedSessions([good, orphan], readModel);

    // Assert
    expect(result.matched.map((m) => m.match.id)).toEqual(["m-1"]);
    expect(result.dangling.map((d) => d.match.id)).toEqual(["m-2"]);
    warn.mockRestore();
  });
});
