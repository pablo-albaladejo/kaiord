/**
 * The target day's same-sport inputs read with the indexed queries (design
 * §3.8, AC-16): a date outside the visible week gives the verdicts the week
 * would, and the moved session never counts against itself.
 */
import { describe, expect, it } from "vitest";

import type { ActivityRecord } from "../types/activity-record";
import { buildCoachingActivityId } from "../types/coaching-activity-record";
import { readDayInputs } from "./read-day-inputs";
import {
  coachActivity,
  coachWorkout,
  PROFILE,
  seedSession,
  sessionMatch,
  THU,
} from "./session-move.test-fixtures";

const OTHER_ACTIVITY = buildCoachingActivityId(PROFILE, "train2go", "88");

const recording = (overrides: Partial<ActivityRecord>): ActivityRecord => ({
  id: "act",
  profileId: PROFILE,
  date: THU,
  sport: "running",
  sourceBridgeId: "garmin",
  externalId: "ext",
  linkedWorkoutId: null,
  krd: null,
  createdAt: "2026-10-01T08:00:00.000Z",
  ...overrides,
});

const read = (persistence: Awaited<ReturnType<typeof seedSession>>) =>
  readDayInputs(persistence, {
    profileId: PROFILE,
    day: THU,
    movedWorkoutId: "w",
  });

describe("readDayInputs", () => {
  it("should read a matched session on the target day, its held recording never relinked", async () => {
    // Arrange
    const persistence = await seedSession();
    await persistence.coaching.upsertMany([
      coachActivity({ id: OTHER_ACTIVITY, sourceId: "88", date: THU }),
    ]);
    await persistence.workouts.put(
      coachWorkout({ id: "w2", date: THU, sport: "cycling" })
    );
    await persistence.sessionMatch.put(
      sessionMatch({
        id: "m2",
        coachingActivityId: OTHER_ACTIVITY,
        workoutId: "w2",
        date: THU,
        executedWorkoutIds: ["rec"],
      })
    );

    // Act
    const inputs = await read(persistence);

    // Assert
    expect(inputs).toEqual([
      { workoutIds: ["w2", "rec"], sport: "cycling", recording: false },
    ]);
  });

  it("should read solo workouts, recordings and unmatched coach plans", async () => {
    // Arrange
    const persistence = await seedSession();
    await persistence.workouts.put(
      coachWorkout({ id: "solo", date: THU, sport: "cycling" })
    );
    await persistence.workouts.put(
      coachWorkout({ id: "twin", date: THU, sport: "running" })
    );
    await persistence.activities.upsertByExternalId(
      recording({ id: "a1", externalId: "e1", linkedWorkoutId: "twin" })
    );
    await persistence.activities.upsertByExternalId(
      recording({ id: "a2", externalId: "e2", sport: "swimming" })
    );
    await persistence.coaching.upsertMany([
      coachActivity({ id: OTHER_ACTIVITY, sourceId: "88", date: THU }),
    ]);

    // Act
    const inputs = await read(persistence);

    // Assert
    expect(inputs).toEqual([
      { workoutIds: ["solo"], sport: "cycling", recording: false },
      { workoutIds: ["twin"], sport: "running", recording: true },
      { workoutIds: ["a2"], sport: "swimming", recording: true },
      { workoutIds: [], sport: "cycling", recording: false },
    ]);
  });

  it("should not count the moved session's own coach plan", async () => {
    // Arrange
    const persistence = await seedSession({ activity: { date: THU } });

    // Act
    const inputs = await read(persistence);

    // Assert
    expect(inputs).toEqual([]);
  });

  it("should not count a recording a match in another week holds", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["a1"] },
    });
    await persistence.activities.upsertByExternalId(
      recording({ id: "a1", externalId: "e1" })
    );

    // Act
    const inputs = await read(persistence);

    // Assert
    expect(inputs).toEqual([]);
  });

  it("should ignore another profile's rows on the target day", async () => {
    // Arrange
    const persistence = await seedSession();
    await persistence.workouts.put(
      coachWorkout({ id: "theirs", profileId: "p2", date: THU })
    );

    // Act
    const inputs = await read(persistence);

    // Assert
    expect(inputs).toEqual([]);
  });
});
