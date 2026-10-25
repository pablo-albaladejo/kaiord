/**
 * Coach follow re-dates the session match (design §3.4, AC-5, AC-24): every
 * row of the §3.11 table that moves the workout's date moves an unlocked
 * match with it, and reports the athlete days it overrode.
 */
import { describe, expect, it } from "vitest";

import { reportMoves } from "../../contexts/coach-move-notice-state";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import {
  coachActivity,
  FRI,
  NOW,
  seedSession,
  THU,
  TUE,
} from "../session-move.test-fixtures";
import { applyCoachDateMoves } from "./apply-coach-date-moves";

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const sync = (
  persistence: Persistence,
  fetched: CoachingActivityRecord,
  preUpsert: CoachingActivityRecord[] = []
) =>
  applyCoachDateMoves({ ...persistence, now: () => NOW }, [fetched], preUpsert);

const matchDate = async (persistence: Persistence) =>
  (await persistence.sessionMatch.getById("m"))?.date;

describe("applyCoachDateMoves with a session match", () => {
  it("should re-date the match on a coach move from the stored coach date", async () => {
    // Arrange
    const persistence = await seedSession();

    // Act
    const moves = await sync(persistence, coachActivity({ date: THU }));

    // Assert
    expect(moves).toEqual({
      coachMoves: 1,
      overriddenLocalMoves: 0,
      overridden: [],
    });
    expect(await persistence.sessionMatch.getById("m")).toMatchObject({
      date: THU,
      updatedAt: NOW,
    });
  });

  it("should re-date the match on a coach move from the pre-upsert date", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { coachDate: undefined },
    });

    // Act
    await sync(persistence, coachActivity({ date: THU }), [coachActivity()]);

    // Assert
    expect(await matchDate(persistence)).toBe(THU);
  });

  it("should leave the match alone when the athlete already chose the coach's new day", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU },
      match: { date: THU },
    });

    // Act
    await sync(persistence, coachActivity({ date: THU }));

    // Assert
    expect(await persistence.sessionMatch.getById("m")).not.toHaveProperty(
      "updatedAt"
    );
    expect(await matchDate(persistence)).toBe(THU);
  });

  it("should re-date the match and report the overridden athlete day", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU },
      match: { date: THU },
    });

    // Act
    const moves = await sync(persistence, coachActivity({ date: FRI }));

    // Assert
    expect(moves).toEqual({
      coachMoves: 0,
      overriddenLocalMoves: 1,
      overridden: [{ workoutId: "w", athleteDate: THU, coachDate: FRI }],
    });
    expect(await matchDate(persistence)).toBe(FRI);
  });

  it("should move the workout but keep an executed match on its recording's day", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });

    // Act
    await sync(persistence, coachActivity({ date: THU }));

    // Assert
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      coachDate: THU,
    });
    expect(await matchDate(persistence)).toBe(TUE);
  });

  it("should move the workout but keep the match of a completed activity", async () => {
    // Arrange
    const persistence = await seedSession();

    // Act
    await sync(persistence, coachActivity({ date: THU, status: "completed" }));

    // Assert
    expect((await persistence.workouts.getById("w"))?.date).toBe(THU);
    expect(await matchDate(persistence)).toBe(TUE);
  });

  it("should move a workout that has no match", async () => {
    // Arrange
    const persistence = await seedSession({ match: null });

    // Act
    const moves = await sync(persistence, coachActivity({ date: THU }));

    // Assert
    expect(moves.coachMoves).toBe(1);
    expect((await persistence.workouts.getById("w"))?.date).toBe(THU);
  });
});

describe("reportMoves with overridden sessions", () => {
  it("should keep the overridden list in the week notice", () => {
    // Arrange
    const overridden = [{ workoutId: "w", athleteDate: THU, coachDate: FRI }];
    const moves = { coachMoves: 0, overriddenLocalMoves: 1, overridden };

    // Act
    const state = reportMoves({ notices: {}, dismissed: {} }, "p1", TUE, moves);

    // Assert
    expect(state.notices[`p1:${TUE}`]).toEqual({ ...moves, seq: 1 });
  });
});
