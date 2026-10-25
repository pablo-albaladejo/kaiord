import { describe, expect, it } from "vitest";

import {
  coachWorkout,
  sessionMatch,
} from "../../application/session-move.test-fixtures";
import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { CoachingActivity } from "../../types/coaching-activity";
import { calendarDriftSubjects } from "./calendar-drift-subjects";

const plan = (overrides: Partial<CoachingActivity> = {}): CoachingActivity => ({
  id: "train2go:77",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-10-06",
  sport: { label: "Bike", icon: "🚴" },
  title: "Threshold",
  status: "pending",
  ...overrides,
});

const matched = (
  id: string,
  overrides: Partial<MatchedSessionWithMetadata> = {}
): MatchedSessionWithMetadata => ({
  activity: plan({ id: `train2go:${id}` }),
  workout: coachWorkout({ id }),
  complianceScore: null,
  executed: [],
  match: sessionMatch({ id: `m-${id}`, workoutId: id }),
  ...overrides,
});

const lockedOf = (subjects: ReturnType<typeof calendarDriftSubjects>) =>
  Object.fromEntries(subjects.map((s) => [s.workout.id, s.locked]));

describe("calendarDriftSubjects", () => {
  it("should lock a done, completed or recorded session and leave a movable one open (AC-29)", () => {
    // Arrange
    const buckets = {
      matchedByDay: {
        "2026-10-06": [
          matched("open"),
          matched("done", { executed: [coachWorkout({ id: "rec" })] }),
          matched("completed", { activity: plan({ status: "completed" }) }),
          matched("recorded"),
        ],
      },
      soloActualsByDay: {},
      executedRefIds: new Set(["recorded"]),
    };

    // Act
    const subjects = calendarDriftSubjects(buckets);

    // Assert
    expect(lockedOf(subjects)).toEqual({
      open: false,
      done: true,
      completed: true,
      recorded: true,
    });
  });

  it("should leave a solo workout open and lock a projected recording", () => {
    // Arrange
    const projected = {
      ...coachWorkout({ id: "proj" }),
      projectedFromActivity: true,
    };
    const buckets = {
      matchedByDay: {},
      soloActualsByDay: {
        "2026-10-06": [coachWorkout({ id: "solo" }), projected],
      },
      executedRefIds: new Set<string>(),
    };

    // Act
    const subjects = calendarDriftSubjects(buckets);

    // Assert
    expect(lockedOf(subjects)).toEqual({ solo: false, proj: true });
  });
});
