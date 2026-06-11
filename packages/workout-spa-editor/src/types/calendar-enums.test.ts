import { describe, expect, it } from "vitest";

import { conditionSchema, workoutStateSchema } from "./calendar-enums";

describe("workoutStateSchema", () => {
  it("should accept all valid states", () => {
    // Arrange

    const states = [
      "raw",
      "structured",
      "ready",
      "pushed",
      "modified",
      "stale",
      "skipped",
    ];

    // Act

    // Assert

    for (const state of states) {
      expect(workoutStateSchema.parse(state)).toBe(state);
    }
  });

  it("should reject invalid state", () => {
    // Arrange

    // Act

    // Assert
    expect(() => workoutStateSchema.parse("invalid")).toThrow();
  });
});

describe("conditionSchema", () => {
  it("should accept all valid conditions", () => {
    // Arrange

    const conditions = [
      "rain",
      "wind",
      "heat",
      "cold",
      "fatigue",
      "injury",
      "altitude",
      "indoor",
    ];

    // Act

    // Assert

    for (const condition of conditions) {
      expect(conditionSchema.parse(condition)).toBe(condition);
    }
  });

  it("should reject invalid condition", () => {
    // Arrange

    // Act

    // Assert
    expect(() => conditionSchema.parse("snow")).toThrow();
  });
});
