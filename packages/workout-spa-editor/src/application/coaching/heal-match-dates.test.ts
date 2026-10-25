/**
 * healMatchDates (design §3.5, AC-10, AC-24): a stale match of a coach-built
 * workout takes the workout's date; a manual cross-day match, a locked match
 * and a match that is already right are left alone.
 */
import { describe, expect, it, vi } from "vitest";

import {
  NOW,
  PROFILE,
  seedSession,
  sessionMatch,
  THU,
  TUE,
} from "../session-move.test-fixtures";
import { healAllMatchDates, healMatchDates } from "./heal-match-dates";

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const LATER = "2026-10-03T07:00:00.000Z";

const heal = (persistence: Persistence) =>
  healMatchDates({ ...persistence, now: () => LATER }, { profileId: PROFILE });

describe("healMatchDates", () => {
  it("should re-date a stale match of a coach-built workout and stamp updatedAt", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { date: THU } });

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(1);
    expect(await persistence.sessionMatch.getById("m")).toEqual({
      ...sessionMatch(),
      date: THU,
      updatedAt: LATER,
    });
  });

  it("should leave a manual cross-day match of a recording untouched", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU, coachDate: undefined, source: "garmin" },
      match: { source: "manual" },
    });

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(0);
    expect(await persistence.sessionMatch.getById("m")).toEqual(
      sessionMatch({ source: "manual" })
    );
  });

  it("should skip a match with an executed slot", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU },
      match: { executedWorkoutIds: ["rec"] },
    });

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(0);
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(TUE);
  });

  it("should skip the match of a completed activity", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: { status: "completed" },
      workout: { date: THU },
    });

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(0);
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(TUE);
  });

  it("should write nothing when every match is on its workout's day", async () => {
    // Arrange
    const persistence = await seedSession();
    const updateDate = vi.spyOn(persistence.sessionMatch, "updateDate");

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(0);
    expect(updateDate).not.toHaveBeenCalled();
  });

  it("should not revert a move that lands between the batch read and the write", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { date: THU } });
    const getById = persistence.sessionMatch.getById;
    let raced = false;
    vi.spyOn(persistence.sessionMatch, "getById").mockImplementation(
      async (id) => {
        if (!raced) {
          raced = true;
          const w = await persistence.workouts.getById("w");
          await persistence.workouts.put({ ...w!, date: TUE });
        }
        return getById(id);
      }
    );

    // Act
    const healed = await heal(persistence);

    // Assert
    expect(healed).toBe(0);
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(TUE);
  });

  it("should heal every profile in healAllMatchDates", async () => {
    // Arrange
    const persistence = await seedSession({ workout: { date: THU } });
    await persistence.profiles.put({
      id: PROFILE,
      name: "Athlete",
      createdAt: NOW,
      updatedAt: NOW,
    } as Parameters<typeof persistence.profiles.put>[0]);

    // Act
    const healed = await healAllMatchDates({
      ...persistence,
      now: () => LATER,
    });

    // Assert
    expect(healed).toBe(1);
    expect((await persistence.sessionMatch.getById("m"))?.date).toBe(THU);
  });
});
