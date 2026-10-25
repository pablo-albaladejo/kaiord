import { describe, expect, it, vi } from "vitest";

import type { KRD } from "../types/krd";
import {
  moveSession,
  SessionNotMovableError,
  WorkoutNotFoundError,
} from "./move-session";
import {
  NOW,
  PROFILE,
  seedSession,
  sessionMatch,
  THU,
  TUE,
} from "./session-move.test-fixtures";

const LATER = "2026-10-02T09:30:00.000Z";

const depsOf = (persistence: Awaited<ReturnType<typeof seedSession>>) => {
  const put = vi.spyOn(persistence.workouts, "put");
  const updateDate = vi.spyOn(persistence.sessionMatch, "updateDate");
  return {
    deps: { ...persistence, now: () => LATER },
    writes: () => put.mock.calls.length + updateDate.mock.calls.length,
  };
};

describe("moveSession", () => {
  it("should re-date the workout and its match with the same updatedAt", async () => {
    // Arrange
    const persistence = await seedSession();
    const { deps } = depsOf(persistence);

    // Act
    const result = await moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    expect(result).toEqual({ kind: "moved", from: TUE, to: THU, matchId: "m" });
    expect(await persistence.workouts.getById("w")).toMatchObject({
      date: THU,
      updatedAt: LATER,
    });
    expect(await persistence.sessionMatch.getById("m")).toMatchObject({
      date: THU,
      updatedAt: LATER,
    });
  });

  it("should move a workout that has no match", async () => {
    // Arrange
    const persistence = await seedSession({ match: null });
    const { deps } = depsOf(persistence);

    // Act
    const result = await moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    expect(result).toEqual({ kind: "moved", from: TUE, to: THU });
    expect((await persistence.workouts.getById("w"))?.date).toBe(THU);
  });

  it("should take the profile from the re-read workout", async () => {
    // Arrange
    const persistence = await seedSession();
    const getByWorkoutId = vi.spyOn(persistence.sessionMatch, "getByWorkoutId");
    const { deps } = depsOf(persistence);

    // Act
    await moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    expect(getByWorkoutId).toHaveBeenCalledWith(PROFILE, "w");
  });

  it("should leave coachDate, state, modifiedAt, garminPushId and krd untouched", async () => {
    // Arrange
    const krd = { version: "1.0" } as KRD;
    const persistence = await seedSession({
      workout: {
        state: "pushed",
        modifiedAt: NOW,
        garminPushId: "g1",
        krd,
      },
    });
    const before = await persistence.workouts.getById("w");
    const { deps } = depsOf(persistence);

    // Act
    await moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    expect(await persistence.workouts.getById("w")).toEqual({
      ...before,
      date: THU,
      updatedAt: LATER,
    });
  });

  it("should return unchanged with no writes when the day is the same", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });
    const { deps, writes } = depsOf(persistence);

    // Act
    const result = await moveSession(deps, { workoutId: "w", targetDay: TUE });

    // Assert
    expect(result).toEqual({ kind: "unchanged" });
    expect(writes()).toBe(0);
  });

  it("should refuse a session with an executed slot", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });
    const { deps, writes } = depsOf(persistence);

    // Act
    const move = moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    await expect(move).rejects.toMatchObject({
      constructor: SessionNotMovableError,
      reason: "executed",
    });
    expect(writes()).toBe(0);
  });

  it("should refuse a session whose activity is completed", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: { status: "completed" },
    });
    const { deps, writes } = depsOf(persistence);

    // Act
    const move = moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    await expect(move).rejects.toMatchObject({ reason: "completed" });
    expect(writes()).toBe(0);
  });

  it("should refuse a recording held by another match", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { id: "rec", coachDate: undefined, source: "garmin" },
      match: { executedWorkoutIds: ["rec"] },
    });
    const { deps, writes } = depsOf(persistence);

    // Act
    const move = moveSession(deps, { workoutId: "rec", targetDay: THU });

    // Assert
    await expect(move).rejects.toMatchObject({ reason: "executed" });
    expect(writes()).toBe(0);
  });

  it.each([
    ["links to it", { id: "act", linkedWorkoutId: "w" }],
    ["is it", { id: "w", linkedWorkoutId: null }],
  ])(
    "should refuse a planned side paired with a recording that %s, with an empty slot",
    async (_label, ref) => {
      // Arrange
      const persistence = await seedSession();
      await persistence.activities.upsertByExternalId({
        ...ref,
        profileId: PROFILE,
        date: TUE,
        sport: "running",
        sourceBridgeId: "garmin",
        externalId: "ext",
        krd: null,
        createdAt: NOW,
      });
      const { deps, writes } = depsOf(persistence);

      // Act
      const move = moveSession(deps, { workoutId: "w", targetDay: THU });

      // Assert
      await expect(move).rejects.toMatchObject({ reason: "executed" });
      expect(writes()).toBe(0);
      expect((await persistence.workouts.getById("w"))?.date).toBe(TUE);
    }
  );

  it("should still move a solo recording that no match holds", async () => {
    // Arrange
    const persistence = await seedSession({ match: null });
    await persistence.activities.upsertByExternalId({
      id: "act",
      profileId: PROFILE,
      date: TUE,
      sport: "running",
      sourceBridgeId: "garmin",
      externalId: "ext",
      linkedWorkoutId: "w",
      krd: null,
      createdAt: NOW,
    });
    const { deps } = depsOf(persistence);

    // Act
    const result = await moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    expect(result).toEqual({ kind: "moved", from: TUE, to: THU });
  });

  it("should throw WorkoutNotFoundError with no writes for a missing workout", async () => {
    // Arrange
    const persistence = await seedSession();
    const { deps, writes } = depsOf(persistence);

    // Act
    const move = moveSession(deps, { workoutId: "gone", targetDay: THU });

    // Assert
    await expect(move).rejects.toBeInstanceOf(WorkoutNotFoundError);
    expect(writes()).toBe(0);
  });

  it("should roll the workout write back when the match re-date fails", async () => {
    // Arrange
    const persistence = await seedSession();
    vi.spyOn(persistence.sessionMatch, "updateDate").mockRejectedValue(
      new Error("boom")
    );
    const deps = { ...persistence, now: () => LATER };

    // Act
    const move = moveSession(deps, { workoutId: "w", targetDay: THU });

    // Assert
    await expect(move).rejects.toThrow("boom");
    expect((await persistence.workouts.getById("w"))?.date).toBe(TUE);
    expect(await persistence.sessionMatch.getById("m")).toEqual(sessionMatch());
  });
});
