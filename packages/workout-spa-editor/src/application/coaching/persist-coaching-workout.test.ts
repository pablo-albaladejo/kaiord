import { describe, expect, it } from "vitest";

import { createInMemorySessionMatchRepository } from "../../test-utils/in-memory-session-match-repository";
import { buildCoachingTemplateKrd } from "./coaching-template";
import type { ConvertManualDeps } from "./convert-coaching-activity-manual-types";
import {
  buildStubAnalytics,
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  stubActivity,
} from "./convert-coaching-activity-with-ai.test-helpers";
import { persistCoachingWorkout } from "./persist-coaching-workout";

const NOW = "2026-05-04T10:00:00.000Z";

const buildDeps = (
  overrides: Partial<ConvertManualDeps> = {}
): ConvertManualDeps => ({
  coaching: buildStubCoachingRepo([]),
  workouts: buildStubWorkoutRepo(),
  sessionMatches: createInMemorySessionMatchRepository(),
  analytics: buildStubAnalytics(),
  newWorkoutId: () => "w-new",
  newMatchId: () => "M-new",
  clock: () => NOW,
  ...overrides,
});

describe("persistCoachingWorkout", () => {
  it("should persist the given (edited) KRD, not a rebuilt template", async () => {
    // Arrange
    const activity = stubActivity({ sport: "cycling" });
    const deps = buildDeps();
    const editedKrd = buildCoachingTemplateKrd("cycling", "EDITED TITLE");

    // Act
    const result = await persistCoachingWorkout(
      { krd: editedKrd, activity },
      deps
    );

    // Assert
    expect(result).toEqual({ workoutId: "w-new", created: true });
    const stored = await deps.workouts.getById("w-new");
    const workout = stored?.krd?.extensions?.structured_workout as {
      name?: string;
    };
    expect(workout.name).toBe("EDITED TITLE");
    expect(stored?.sport).toBe("cycling");
  });

  it("should write a SessionMatch pointing to the new workout", async () => {
    // Arrange
    const activity = stubActivity({ sport: "cycling" });
    const deps = buildDeps();
    const krd = buildCoachingTemplateKrd("cycling", activity.title);

    // Act
    await persistCoachingWorkout({ krd, activity }, deps);

    // Assert
    const match = await deps.sessionMatches.getByActivityId("p1", activity.id);
    expect(match?.workoutId).toBe("w-new");
  });

  it("should be idempotent and return the existing workout without re-creating", async () => {
    // Arrange
    const activity = stubActivity({ sport: "cycling" });
    const workouts = buildStubWorkoutRepo();
    workouts.setSourceLookup({
      id: "w-existing",
      krd: buildCoachingTemplateKrd("cycling", activity.title),
    } as never);
    const deps = buildDeps({ workouts });
    const krd = buildCoachingTemplateKrd("cycling", activity.title);

    // Act
    const result = await persistCoachingWorkout({ krd, activity }, deps);

    // Assert
    expect(result.created).toBe(false);
    expect(result.workoutId).toBe("w-existing");
  });
});
