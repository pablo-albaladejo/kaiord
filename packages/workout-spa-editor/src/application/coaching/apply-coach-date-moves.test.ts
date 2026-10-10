/**
 * Follow the coach (design §3.11, AC-37..40): the coach-date decision
 * table and its application to converted workouts after a week sync.
 */

import { describe, expect, it } from "vitest";

import { createInMemoryWorkoutRepository } from "../../test-utils/in-memory-workout-repository";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
import { makeWorkoutRecord } from "../test-helpers";
import {
  applyCoachDateMoves,
  coachDateVerdict,
} from "./apply-coach-date-moves";

const MON = "2026-04-13";
const TUE = "2026-04-14";
const WED = "2026-04-15";
const NOW = "2026-04-28T10:00:00.000Z";
const EDITED = "2026-04-20T09:00:00.000Z";
const PROFILE = "p1";
const SOURCE_ID = "901";
const MOVE = { date: TUE, coachDate: TUE };

const activity = (date: string): CoachingActivityRecord => ({
  id: buildCoachingActivityId(PROFILE, "train2go", SOURCE_ID),
  profileId: PROFILE,
  source: "train2go",
  sourceId: SOURCE_ID,
  date,
  sport: "cycling",
  title: "Threshold",
  status: "pending",
  fetchedAt: NOW,
});

const converted = (date: string, coachDate?: string) =>
  makeWorkoutRecord({
    id: "w-1",
    profileId: PROFILE,
    date,
    coachDate,
    sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
    state: "ready",
    modifiedAt: EDITED,
  });

describe("coachDateVerdict", () => {
  it.each([
    {
      name: "record the fetched date as the baseline when none exists",
      workout: { date: MON },
      pre: undefined,
      expected: { write: { date: MON, coachDate: MON } },
    },
    {
      name: "record the coach date without moving an athlete move",
      workout: { date: WED },
      pre: MON,
      expected: { write: { date: WED, coachDate: MON } },
    },
    {
      name: "write nothing when the coach date is unchanged",
      workout: { date: WED, coachDate: TUE },
      pre: undefined,
      expected: {},
    },
    {
      name: "follow a coach move from the stored coach date",
      workout: { date: MON, coachDate: MON },
      pre: undefined,
      expected: { write: MOVE, count: "coachMoves" },
    },
    {
      name: "follow a coach move from the pre-upsert date",
      workout: { date: MON },
      pre: MON,
      expected: { write: MOVE, count: "coachMoves" },
    },
    {
      name: "only re-baseline when the athlete already chose that day",
      workout: { date: TUE, coachDate: MON },
      pre: undefined,
      expected: { write: MOVE },
    },
    {
      name: "let the coach override a different local move",
      workout: { date: WED, coachDate: MON },
      pre: undefined,
      expected: { write: MOVE, count: "overriddenLocalMoves" },
    },
  ])("should $name", ({ workout, pre, expected }) => {
    // Arrange
    const fetched = expected.write?.coachDate ?? TUE;

    // Act
    const verdict = coachDateVerdict(workout, pre, fetched);

    // Assert
    expect(verdict).toEqual(expected);
  });
});

describe("applyCoachDateMoves", () => {
  const setup = async (workout?: ReturnType<typeof converted>) => {
    const workouts = createInMemoryWorkoutRepository();
    if (workout) await workouts.put(workout);
    return {
      workouts,
      now: () => NOW,
      transaction: <T>(fn: () => Promise<T>) => fn(),
    };
  };

  it("should write nothing for an activity that was never converted", async () => {
    // Arrange
    const deps = await setup();

    // Act
    const counts = await applyCoachDateMoves(
      deps,
      [activity(TUE)],
      [activity(MON)]
    );

    // Assert
    expect(counts).toEqual({ coachMoves: 0, overriddenLocalMoves: 0 });
    expect(await deps.workouts.getById("w-1")).toBeUndefined();
  });

  it("should move the workout and keep modifiedAt and state", async () => {
    // Arrange
    const deps = await setup(converted(MON, MON));

    // Act
    const counts = await applyCoachDateMoves(deps, [activity(TUE)], []);

    // Assert
    expect(counts).toEqual({ coachMoves: 1, overriddenLocalMoves: 0 });
    expect(await deps.workouts.getById("w-1")).toMatchObject({
      date: TUE,
      coachDate: TUE,
      state: "ready",
      modifiedAt: EDITED,
      updatedAt: NOW,
    });
  });

  it("should count an overridden local move", async () => {
    // Arrange
    const deps = await setup(converted(WED, MON));

    // Act
    const counts = await applyCoachDateMoves(deps, [activity(TUE)], []);

    // Assert
    expect(counts).toEqual({ coachMoves: 0, overriddenLocalMoves: 1 });
    expect((await deps.workouts.getById("w-1"))?.date).toBe(TUE);
  });

  it("should write nothing on a repeated sync of the same coach date", async () => {
    // Arrange
    const deps = await setup(converted(MON, MON));
    await applyCoachDateMoves(deps, [activity(TUE)], []);
    const settled = await deps.workouts.getById("w-1");

    // Act
    const counts = await applyCoachDateMoves(
      { ...deps, now: () => EDITED },
      [activity(TUE)],
      [activity(TUE)]
    );

    // Assert
    expect(counts).toEqual({ coachMoves: 0, overriddenLocalMoves: 0 });
    expect(await deps.workouts.getById("w-1")).toEqual(settled);
  });
});
