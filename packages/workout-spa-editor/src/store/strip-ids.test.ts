import { describe, expect, it } from "vitest";

import type { KRD, Workout } from "../types/krd";
import { isRepetitionBlock } from "../types/krd";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import { stripIds } from "./strip-ids";

const sampleKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 200 } },
        },
        {
          repeatCount: 2,
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "power",
              target: { type: "power", value: { unit: "watts", value: 180 } },
            },
          ],
        },
      ],
    } as Workout,
  },
};

describe("stripIds", () => {
  it("should remove id fields from every step and block", () => {
    // Arrange
    const ui = hydrateUIWorkout(sampleKrd);
    const stripped = stripIds(ui);

    // Act
    const workout = stripped.extensions?.structured_workout as
      | Workout
      | undefined;

    // Assert
    expect(workout).toBeDefined();
    for (const item of workout!.steps) {
      expect((item as { id?: string }).id).toBeUndefined();
      if (isRepetitionBlock(item)) {
        for (const inner of item.steps) {
          expect((inner as { id?: string }).id).toBeUndefined();
        }
      }
    }
  });

  it("should be idempotent for already-stripped payloads", () => {
    // Arrange

    // Act
    const stripped = stripIds(sampleKrd);

    // Assert
    expect(stripped).toEqual(sampleKrd);
  });

  it("should pass through a workout with no structured_workout extension", () => {
    // Arrange

    // Act
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
    };

    // Assert
    expect(stripIds(krd)).toEqual(krd);
  });

  it("should round-trip cleanly via hydrate + strip", () => {
    // Arrange
    const ui = hydrateUIWorkout(sampleKrd);

    // Act
    const stripped = stripIds(ui);

    // Assert
    expect(stripped).toEqual(sampleKrd);
  });
});
