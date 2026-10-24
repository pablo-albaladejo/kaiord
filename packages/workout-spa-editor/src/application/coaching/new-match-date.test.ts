/**
 * A new match is dated from the effective date (design §3.1, AC-27): the
 * workout's `date` for a coach-built workout, so a session the athlete moved
 * before it was matched lands on its new day; the activity's `date` otherwise.
 */
import { describe, expect, it, vi } from "vitest";

import { convertAndAutoMatch } from "../convert-and-auto-match";
import { matchSession } from "../match-session";
import {
  ACTIVITY_ID,
  coachActivity,
  coachWorkout,
  PROFILE,
  seedSession,
  THU,
  TUE,
} from "../session-move.test-fixtures";
import { convertCoachingActivityManual } from "./convert-coaching-activity-manual";
import { convertCoachingActivityWithAi } from "./convert-coaching-activity-with-ai";
import { buildStubAnalytics } from "./convert-coaching-activity-with-ai.test-helpers";
import { sessionMatchDate } from "./session-match-date";

type Persistence = Awaited<ReturnType<typeof seedSession>>;

const NOW = "2026-10-02T09:00:00.000Z";

const movedUnmatched = () =>
  seedSession({ workout: { date: THU, state: "structured" }, match: null });

const convertDeps = (persistence: Persistence) => ({
  coaching: persistence.coaching,
  workouts: persistence.workouts,
  sessionMatches: persistence.sessionMatch,
  analytics: buildStubAnalytics(),
  generateKrd: vi.fn(),
  newWorkoutId: () => "w-new",
  newMatchId: () => "m-new",
  clock: () => NOW,
});

const newMatchDate = async (persistence: Persistence) =>
  (await persistence.sessionMatch.getByActivityId(PROFILE, ACTIVITY_ID))?.date;

describe("sessionMatchDate", () => {
  it("should take the workout's date for a coach-built workout", () => {
    // Arrange
    const workout = coachWorkout({ date: THU });

    // Act
    const date = sessionMatchDate(workout, coachActivity());

    // Assert
    expect(date).toBe(THU);
  });

  it("should take the activity's date for a workout that is not coach-built", () => {
    // Arrange
    const workout = coachWorkout({ date: THU, coachDate: undefined });

    // Act
    const date = sessionMatchDate(workout, coachActivity());

    // Assert
    expect(date).toBe(TUE);
  });
});

describe("a new match for a moved coach-built workout", () => {
  it("should be dated from the workout in the manual convert of an existing workout", async () => {
    // Arrange
    const persistence = await movedUnmatched();

    // Act
    await convertCoachingActivityManual(
      { activityId: ACTIVITY_ID },
      convertDeps(persistence)
    );

    // Assert
    expect(await newMatchDate(persistence)).toBe(THU);
  });

  it("should be dated from the workout in the AI convert of an existing workout", async () => {
    // Arrange
    const persistence = await movedUnmatched();

    // Act
    await convertCoachingActivityWithAi(
      { activityId: ACTIVITY_ID },
      convertDeps(persistence)
    );

    // Assert
    expect(await newMatchDate(persistence)).toBe(THU);
  });

  it("should be dated from the workout in convertAndAutoMatch", async () => {
    // Arrange
    const persistence = await movedUnmatched();

    // Act
    await convertAndAutoMatch(
      { activityId: ACTIVITY_ID },
      {
        coaching: persistence.coaching,
        workouts: persistence.workouts,
        sessionMatches: persistence.sessionMatch,
        newWorkoutId: () => "w-new",
        newMatchId: () => "m-new",
        clock: () => NOW,
      }
    );

    // Assert
    expect(await newMatchDate(persistence)).toBe(THU);
  });

  it("should be dated from the workout in matchSession", async () => {
    // Arrange
    const persistence = await movedUnmatched();

    // Act
    const match = await matchSession(
      { profileId: PROFILE, coachingActivityId: ACTIVITY_ID, workoutId: "w" },
      {
        clock: () => NOW,
        idGenerator: () => "m-new",
        repository: persistence.sessionMatch,
        coachingRepository: persistence.coaching,
        workoutRepository: persistence.workouts,
      }
    );

    // Assert
    expect(match.date).toBe(THU);
  });

  it("should keep the activity's date in matchSession for a recording", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU, coachDate: undefined, source: "garmin" },
      match: null,
    });

    // Act
    const match = await matchSession(
      { profileId: PROFILE, coachingActivityId: ACTIVITY_ID, workoutId: "w" },
      {
        clock: () => NOW,
        idGenerator: () => "m-new",
        repository: persistence.sessionMatch,
        coachingRepository: persistence.coaching,
        workoutRepository: persistence.workouts,
      }
    );

    // Assert
    expect(match.date).toBe(TUE);
  });
});
