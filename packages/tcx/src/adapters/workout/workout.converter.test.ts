import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { convertTcxWorkout } from "./workout.converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("convertTcxWorkout", () => {
  it("should convert a workout with Running sport", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Morning Run",
      Step: {
        "@_xsi:type": "Step_t",
        Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
        Target: { "@_xsi:type": "None_t" },
        Intensity: "Warmup",
      },
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.sport).toBe("running");
    expect(result.name).toBe("Morning Run");
    expect(result.steps).toHaveLength(1);
  });

  it.each([
    ["Biking", "cycling"],
    ["Other", "generic"],
    ["Swimming", "generic"],
    [undefined, "generic"],
  ])("should resolve sport %s to %s", (sportAttr, expectedSport) => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": sportAttr,
      Name: "Test Workout",
      Step: [],
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.sport).toBe(expectedSport);
  });

  it("should handle multiple steps as array", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Intervals",
      Step: [
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Warmup",
        },
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 60 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Active",
        },
      ],
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.steps).toHaveLength(2);
  });

  it("should handle single step (not in array)", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Biking",
      Name: "Easy Ride",
      Step: {
        "@_xsi:type": "Step_t",
        Duration: { "@_xsi:type": "Time_t", Seconds: 3600 },
        Target: { "@_xsi:type": "None_t" },
        Intensity: "Active",
      },
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.steps).toHaveLength(1);
  });

  it("should handle no steps", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "Empty Workout",
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.steps).toHaveLength(0);
  });

  it("should handle workout with extensions", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Biking",
      Name: "With Extensions",
      Step: [],
      Extensions: {
        CustomField: "custom_value",
      },
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.extensions).toStrictEqual({
      tcx: { CustomField: "custom_value" },
    });
  });

  it("should not include extensions when not present", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "No Extensions",
      Step: [],
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.extensions).toBeUndefined();
  });

  it("should convert Repeat_t steps into repetition blocks", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Name: "With Repeats",
      Step: [
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Warmup",
        },
        {
          "@_xsi:type": "Repeat_t",
          Repetitions: 3,
          Child: [
            {
              "@_xsi:type": "Step_t",
              Duration: { "@_xsi:type": "Time_t", Seconds: 60 },
              Target: { "@_xsi:type": "None_t" },
              Intensity: "Active",
            },
            {
              "@_xsi:type": "Step_t",
              Duration: { "@_xsi:type": "Time_t", Seconds: 30 },
              Target: { "@_xsi:type": "None_t" },
              Intensity: "Resting",
            },
          ],
        },
        {
          "@_xsi:type": "Step_t",
          Duration: { "@_xsi:type": "Time_t", Seconds: 300 },
          Target: { "@_xsi:type": "None_t" },
          Intensity: "Cooldown",
        },
      ],
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    const topLevelEntries = 3;
    expect(result.steps).toHaveLength(topLevelEntries);
    const [warmup, block, cooldown] = result.steps;
    expect(warmup).toMatchObject({ stepIndex: 0, intensity: "warmup" });
    expect(block).toMatchObject({
      repeatCount: 3,
      steps: [
        { stepIndex: 1, intensity: "active" },
        { stepIndex: 2, intensity: "rest" },
      ],
    });
    expect(cooldown).toMatchObject({ stepIndex: 3, intensity: "cooldown" });
  });

  it("should handle missing name", () => {
    // Arrange
    const logger = createMockLogger();
    const tcxWorkout = {
      "@_Sport": "Running",
      Step: [],
    };

    // Act
    const result = convertTcxWorkout(tcxWorkout, logger);

    // Assert
    expect(result.name).toBeUndefined();
  });
});
