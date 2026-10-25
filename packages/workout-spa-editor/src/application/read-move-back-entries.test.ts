/**
 * The live half of the coach-move notice (design §3.9, AC-18): an entry
 * stays while its workout still sits on the coach's date, and carries the
 * workout's movability so the notice can show the block reason.
 */
import { describe, expect, it } from "vitest";

import { readMoveBackEntries } from "./read-move-back-entries";
import { PROFILE, seedSession, THU, TUE } from "./session-move.test-fixtures";

const entry = { workoutId: "w", athleteDate: TUE, coachDate: THU };

describe("readMoveBackEntries", () => {
  it("should keep an entry whose workout is still on the coach's date", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU, coachDate: THU },
      match: { date: THU },
    });

    // Act
    const entries = await readMoveBackEntries(persistence, PROFILE, [entry]);

    // Assert
    expect(entries).toEqual([{ ...entry, movability: { movable: true } }]);
  });

  it("should hide an entry once the workout left the coach's date", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: "2026-10-07", coachDate: THU },
    });

    // Act
    const entries = await readMoveBackEntries(persistence, PROFILE, [entry]);

    // Assert
    expect(entries).toEqual([]);
  });

  it("should hide an entry whose workout is gone", async () => {
    // Arrange
    const persistence = await seedSession({ match: null });
    await persistence.workouts.delete("w");

    // Act
    const entries = await readMoveBackEntries(persistence, PROFILE, [entry]);

    // Assert
    expect(entries).toEqual([]);
  });

  it("should carry the reason when the session can no longer move", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: { date: THU, status: "completed" },
      workout: { date: THU, coachDate: THU },
      match: { date: THU },
    });

    // Act
    const entries = await readMoveBackEntries(persistence, PROFILE, [entry]);

    // Assert
    expect(entries.map((e) => e.movability)).toEqual([
      { movable: false, reason: "completed" },
    ]);
  });
});
