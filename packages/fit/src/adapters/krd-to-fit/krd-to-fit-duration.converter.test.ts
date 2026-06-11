import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertDuration } from "./krd-to-fit-duration.converter";

const TIME_SECONDS = 60;
const HR_BPM = 130;
const DISTANCE_METERS = 2000;
const POWER_WATTS = 280;

const baseStep = (overrides: Partial<WorkoutStep>): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: TIME_SECONDS },
  targetType: "open",
  target: { type: "open" },
  ...overrides,
});

describe("convertDuration", () => {
  it("should dispatch a simple time duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = baseStep({});

    // Act
    convertDuration(step, message);

    // Assert
    expect(message.durationType).toBe("time");
    expect(message.durationTime).toBe(TIME_SECONDS);
  });

  it("should dispatch a conditional heart rate duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = baseStep({
      durationType: "heart_rate_less_than",
      duration: { type: "heart_rate_less_than", bpm: HR_BPM },
    });

    // Act
    convertDuration(step, message);

    // Assert
    expect(message.durationType).toBe("hrLessThan");
    expect(message.durationHr).toBe(HR_BPM);
  });

  it("should dispatch a repeat until distance duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = baseStep({
      durationType: "repeat_until_distance",
      duration: {
        type: "repeat_until_distance",
        meters: DISTANCE_METERS,
        repeatFrom: 1,
      },
    });

    // Act
    convertDuration(step, message);

    // Assert
    expect(message.durationType).toBe("repeatUntilDistance");
    expect(message.durationDistance).toBe(DISTANCE_METERS);
    expect(message.durationStep).toBe(1);
  });

  it("should dispatch a repeat until power greater than duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = baseStep({
      durationType: "repeat_until_power_greater_than",
      duration: {
        type: "repeat_until_power_greater_than",
        watts: POWER_WATTS,
        repeatFrom: 0,
      },
    });

    // Act
    convertDuration(step, message);

    // Assert
    expect(message.durationType).toBe("repeatUntilPowerGreaterThan");
    expect(message.durationPower).toBe(POWER_WATTS);
    expect(message.durationStep).toBe(0);
  });

  it("should fall back to open for an open duration", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = baseStep({
      durationType: "open",
      duration: { type: "open" },
    });

    // Act
    convertDuration(step, message);

    // Assert
    expect(message).toStrictEqual({ durationType: "open" });
  });
});
