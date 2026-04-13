import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../../types/calendar-record";
import { countRawWorkouts, groupWorkoutsByDay } from "./calendar-utils";

function makeWorkout(
  id: string,
  date: string,
  createdAt: string,
  state = "raw"
): WorkoutRecord {
  return {
    id,
    date,
    sport: "running",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: state as WorkoutRecord["state"],
    raw: null,
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt,
    modifiedAt: null,
    updatedAt: createdAt,
  };
}

describe("groupWorkoutsByDay", () => {
  const days = ["2026-04-06", "2026-04-07", "2026-04-08"];

  it("groups workouts by date", () => {
    const workouts = [
      makeWorkout("w1", "2026-04-06", "2026-04-06T08:00:00.000Z"),
      makeWorkout("w2", "2026-04-08", "2026-04-08T10:00:00.000Z"),
    ];

    const result = groupWorkoutsByDay(workouts, days);

    expect(result["2026-04-06"]).toHaveLength(1);
    expect(result["2026-04-07"]).toHaveLength(0);
    expect(result["2026-04-08"]).toHaveLength(1);
  });

  it("sorts by createdAt ascending", () => {
    const workouts = [
      makeWorkout("late", "2026-04-06", "2026-04-06T18:00:00.000Z"),
      makeWorkout("early", "2026-04-06", "2026-04-06T06:00:00.000Z"),
    ];

    const result = groupWorkoutsByDay(workouts, days);

    expect(result["2026-04-06"][0].id).toBe("early");
    expect(result["2026-04-06"][1].id).toBe("late");
  });

  it("handles undefined workouts", () => {
    const result = groupWorkoutsByDay(undefined, days);

    expect(result["2026-04-06"]).toHaveLength(0);
  });
});

describe("countRawWorkouts", () => {
  it("counts only raw state workouts", () => {
    const workouts = [
      makeWorkout("w1", "2026-04-06", "2026-04-06T08:00:00.000Z", "raw"),
      makeWorkout("w2", "2026-04-06", "2026-04-06T09:00:00.000Z", "pushed"),
      makeWorkout("w3", "2026-04-07", "2026-04-07T08:00:00.000Z", "raw"),
    ];

    expect(countRawWorkouts(workouts)).toBe(2);
  });

  it("returns 0 for undefined", () => {
    expect(countRawWorkouts(undefined)).toBe(0);
  });
});
