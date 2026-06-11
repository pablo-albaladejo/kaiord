import type { KRD, Sport, Target, WorkoutStep } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "../fast-xml-parser";
import { createXsdTcxValidator } from "../xsd-validator";

const buildStep = (stepIndex: number, target: Target): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: target.type,
  target,
});

const buildWorkoutKrd = (sport: Sport, targets: Array<Target>): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-11T10:00:00.000Z", sport },
  extensions: {
    structured_workout: {
      name: "Target round trip",
      sport,
      steps: targets.map((target, index) => buildStep(index, target)),
    },
  },
});

const roundTrip = async (
  krd: KRD
): Promise<{ steps: Array<WorkoutStep>; xml: string }> => {
  const logger = createMockLogger();
  const writer = createFastXmlTcxWriter(logger, createXsdTcxValidator(logger));
  const reader = createFastXmlTcxReader(logger);
  const xml = await writer(krd);
  const restored = await reader(xml);
  const workout = restored.extensions?.structured_workout as {
    steps: Array<WorkoutStep>;
  };
  return { steps: workout.steps, xml };
};

describe("Round-trip: cadence and pace targets on the wired TCX path", () => {
  it("should preserve running cadence targets within one rpm", async () => {
    // Arrange
    const krd = buildWorkoutKrd("running", [
      { type: "cadence", value: { unit: "rpm", value: 90 } },
      { type: "cadence", value: { unit: "range", min: 85, max: 95 } },
    ]);

    // Act
    const { steps, xml } = await roundTrip(krd);

    // Assert
    expect(steps[0].target).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
    expect(steps[1].target).toStrictEqual({
      type: "cadence",
      value: { unit: "range", min: 85, max: 95 },
    });
    expect(xml).toContain("180");
  });

  it("should preserve cycling cadence targets unchanged", async () => {
    // Arrange
    const krd = buildWorkoutKrd("cycling", [
      { type: "cadence", value: { unit: "rpm", value: 90 } },
    ]);

    // Act
    const { steps, xml } = await roundTrip(krd);

    // Assert
    expect(steps[0].target).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    });
    expect(xml).not.toContain("180");
  });

  it("should preserve pace targets with a consistent unit", async () => {
    // Arrange
    const krd = buildWorkoutKrd("running", [
      { type: "pace", value: { unit: "mps", value: 3.5 } },
      { type: "pace", value: { unit: "range", min: 3.0, max: 4.0 } },
    ]);

    // Act
    const { steps } = await roundTrip(krd);

    // Assert
    expect(steps[0].target).toStrictEqual({
      type: "pace",
      value: { unit: "mps", value: 3.5 },
    });
    expect(steps[1].target).toStrictEqual({
      type: "pace",
      value: { unit: "range", min: 3.0, max: 4.0 },
    });
  });
});
