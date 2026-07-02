import { describe, expect, it } from "vitest";

import {
  deriveCoachingActivityLifecycle,
  deriveWorkoutLifecycle,
} from "./session-lifecycle";

const baseWorkout = {
  source: "kaiord",
  aiMeta: null,
  garminPushId: null,
};

describe("deriveWorkoutLifecycle", () => {
  it("should mark no facet active for a plain manual workout", () => {
    // Arrange
    const workout = { ...baseWorkout };

    // Act
    const flags = deriveWorkoutLifecycle(workout);

    // Assert
    expect(flags).toEqual({
      fromCoach: false,
      aiAssisted: false,
      pushedToGarmin: false,
      executedAndMatched: false,
    });
  });

  it("should mark fromCoach when source is train2go", () => {
    // Arrange
    const workout = { ...baseWorkout, source: "train2go" };

    // Act
    const flags = deriveWorkoutLifecycle(workout);

    // Assert
    expect(flags.fromCoach).toBe(true);
  });

  it("should mark aiAssisted when source is ai-generated", () => {
    // Arrange
    const workout = { ...baseWorkout, source: "ai-generated" };

    // Act
    const flags = deriveWorkoutLifecycle(workout);

    // Assert
    expect(flags.aiAssisted).toBe(true);
  });

  it("should mark aiAssisted when aiMeta is present regardless of source", () => {
    // Arrange
    const workout = {
      ...baseWorkout,
      source: "train2go",
      aiMeta: {
        promptVersion: "v1",
        model: "m",
        provider: "p",
        processedAt: "2026-04-06T00:00:00.000Z",
      },
    };

    // Act
    const flags = deriveWorkoutLifecycle(workout);

    // Assert
    expect(flags.aiAssisted).toBe(true);
  });

  it("should mark pushedToGarmin when garminPushId is set", () => {
    // Arrange
    const workout = { ...baseWorkout, garminPushId: "garmin-123" };

    // Act
    const flags = deriveWorkoutLifecycle(workout);

    // Assert
    expect(flags.pushedToGarmin).toBe(true);
  });

  it("should mark executedAndMatched only when the executed count is > 0", () => {
    // Arrange
    const workout = { ...baseWorkout };

    // Act
    const zero = deriveWorkoutLifecycle(workout, 0);
    const two = deriveWorkoutLifecycle(workout, 2);

    // Assert
    expect(zero.executedAndMatched).toBe(false);
    expect(two.executedAndMatched).toBe(true);
  });

  it("should combine all four facets independently", () => {
    // Arrange
    const workout = {
      source: "train2go",
      aiMeta: {
        promptVersion: "v1",
        model: "m",
        provider: "p",
        processedAt: "2026-04-06T00:00:00.000Z",
      },
      garminPushId: "garmin-123",
    };

    // Act
    const flags = deriveWorkoutLifecycle(workout, 1);

    // Assert
    expect(flags).toEqual({
      fromCoach: true,
      aiAssisted: true,
      pushedToGarmin: true,
      executedAndMatched: true,
    });
  });
});

describe("deriveCoachingActivityLifecycle", () => {
  it("should mark only fromCoach for a train2go activity", () => {
    // Arrange
    const activity = { source: "train2go" };

    // Act
    const flags = deriveCoachingActivityLifecycle(activity);

    // Assert
    expect(flags).toEqual({
      fromCoach: true,
      aiAssisted: false,
      pushedToGarmin: false,
      executedAndMatched: false,
    });
  });

  it("should not fabricate fromCoach for an unknown source", () => {
    // Arrange
    const activity = { source: "trainingpeaks" };

    // Act
    const flags = deriveCoachingActivityLifecycle(activity);

    // Assert
    expect(flags.fromCoach).toBe(false);
  });
});
