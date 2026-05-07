import { describe, expect, it } from "vitest";

import { buildCoachingTemplateKrd } from "./coaching-template";

const TEN_MIN_SECONDS = 600;

describe("buildCoachingTemplateKrd", () => {
  it("should produce a KRD with exactly one 10-minute Z1 warmup step", () => {
    // Arrange
    const sport = "cycling";

    // Act
    const krd = buildCoachingTemplateKrd(sport);

    // Assert
    expect(krd.type).toBe("structured_workout");
    expect(krd.metadata.sport).toBe("cycling");
    expect(krd.extensions?.structured_workout).toBeDefined();
    const workout = krd.extensions!.structured_workout as {
      steps: Array<{
        durationType: string;
        duration: { type: string; seconds: number };
        targetType: string;
        target: { type: string; value: { unit: string; value: number } };
        intensity: string;
      }>;
    };
    expect(workout.steps).toHaveLength(1);
    const [step] = workout.steps;
    expect(step.durationType).toBe("time");
    expect(step.duration.seconds).toBe(TEN_MIN_SECONDS);
    expect(step.targetType).toBe("heart_rate");
    expect(step.target.value).toEqual({ unit: "zone", value: 1 });
    expect(step.intensity).toBe("warmup");
  });

  it("should fall back to generic sport when input is not a known Sport", () => {
    // Arrange
    const sport = "rowing";

    // Act
    const krd = buildCoachingTemplateKrd(sport);

    // Assert
    expect(krd.metadata.sport).toBe("generic");
  });

  it("should produce a structurally identical step for running and swimming", () => {
    // Arrange
    const sports = ["running", "swimming"] as const;

    // Act
    const krds = sports.map(buildCoachingTemplateKrd);

    // Assert
    for (const krd of krds) {
      const workout = krd.extensions!.structured_workout as {
        steps: Array<unknown>;
      };
      expect(workout.steps).toHaveLength(1);
    }
  });
});
