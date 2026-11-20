import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { compareSteps } from "./compare-steps";

const krdWithSteps = (steps?: Array<Record<string, unknown>>): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
    extensions:
      steps === undefined ? undefined : { structured_workout: { steps } },
  }) as KRD;

const step = (stepIndex: number, extra: Record<string, unknown> = {}) => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  ...extra,
});

describe("compareSteps", () => {
  it("should count zero steps when neither file has a workout", () => {
    // Arrange
    const krd1 = krdWithSteps();
    const krd2 = krdWithSteps();

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result).toEqual({ file1Count: 0, file2Count: 0, differences: [] });
  });

  it("should report no differences for equal steps", () => {
    // Arrange
    const krd1 = krdWithSteps([step(0)]);
    const krd2 = krdWithSteps([step(0)]);

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result.differences).toEqual([]);
  });

  it("should report each differing field of a shared step", () => {
    // Arrange
    const krd1 = krdWithSteps([step(0, { intensity: "warmup" })]);
    const krd2 = krdWithSteps([step(0, { intensity: "active", name: "Go" })]);

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result.differences).toEqual([
      { stepIndex: 0, field: "name", file1Value: undefined, file2Value: "Go" },
      {
        stepIndex: 0,
        field: "intensity",
        file1Value: "warmup",
        file2Value: "active",
      },
    ]);
  });

  it("should report a step present only in the second file", () => {
    // Arrange
    const krd1 = krdWithSteps([step(0)]);
    const krd2 = krdWithSteps([step(0), step(1)]);

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result.file1Count).toBe(1);
    expect(result.file2Count).toBe(2);
    expect(result.differences).toEqual([
      {
        stepIndex: 1,
        field: "step",
        file1Value: undefined,
        file2Value: step(1),
      },
    ]);
  });

  it("should report a step present only in the first file", () => {
    // Arrange
    const krd1 = krdWithSteps([step(0), step(1)]);
    const krd2 = krdWithSteps([step(0)]);

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result.differences).toEqual([
      {
        stepIndex: 1,
        field: "step",
        file1Value: step(1),
        file2Value: undefined,
      },
    ]);
  });

  it("should skip a slot that is empty in both files", () => {
    // Arrange
    const krd1 = krdWithSteps([step(0), undefined as never]);
    const krd2 = krdWithSteps([step(0)]);

    // Act
    const result = compareSteps(krd1, krd2);

    // Assert
    expect(result.differences).toEqual([]);
  });
});
