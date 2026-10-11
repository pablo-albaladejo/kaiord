import { describe, expect, it } from "vitest";

import { addWorkoutStepMainFields } from "./workout-step-main-fields.converter";

const DISTANCE_METERS = 500;
const DISTANCE_RAW = 50000;
const POWER_ZONE = 4;
const REPEAT_HR_BPM = 160;
const REPEAT_FROM = 1;

describe("addWorkoutStepMainFields", () => {
  it("should fill durationValue from the active durationDistance sub-field, scaled", () => {
    // Arrange
    const message = {
      durationType: "distance",
      durationDistance: DISTANCE_METERS,
    };

    // Act
    const result = addWorkoutStepMainFields(message);

    // Assert
    expect(result).toStrictEqual({ ...message, durationValue: DISTANCE_RAW });
  });

  it("should fill targetValue from the active targetPowerZone sub-field", () => {
    // Arrange
    const message = { targetType: "power", targetPowerZone: POWER_ZONE };

    // Act
    const result = addWorkoutStepMainFields(message);

    // Assert
    expect(result.targetValue).toBe(POWER_ZONE);
  });

  it("should fill both main fields for a repeat-until step", () => {
    // Arrange
    const message = {
      durationType: "repeatUntilHrGreaterThan",
      durationStep: REPEAT_FROM,
      repeatHr: REPEAT_HR_BPM,
    };

    // Act
    const result = addWorkoutStepMainFields(message);

    // Assert
    expect(result).toMatchObject({
      durationValue: REPEAT_FROM,
      targetValue: REPEAT_HR_BPM,
    });
  });

  it("should resolve a numeric reference value the same as its enum name", () => {
    // Arrange
    const message = { durationType: 1, durationDistance: DISTANCE_METERS };

    // Act
    const result = addWorkoutStepMainFields(message);

    // Assert
    expect(result.durationValue).toBe(DISTANCE_RAW);
  });

  it("should ignore a sub-field that the reference field does not activate", () => {
    // Arrange
    const message = { durationType: "time", durationDistance: DISTANCE_METERS };

    // Act
    const result = addWorkoutStepMainFields(message);

    // Assert
    expect(result).toStrictEqual(message);
  });
});
