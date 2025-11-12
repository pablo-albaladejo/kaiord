import { describe, expect, it } from "vitest";
import type { Duration } from "../../domain/schemas/duration";
import { FIT_DURATION_TYPE } from "./constants";
import { mapDuration, mapDurationType } from "./duration.mapper";
import type { FitWorkoutStep } from "./types";

describe("mapDuration", () => {
  describe("time-based durations", () => {
    it("should convert FIT time duration to seconds", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
        durationTime: 300,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 300,
      });
    });

    it("should handle zero seconds", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
        durationTime: 0,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 0,
      });
    });

    it("should handle large time values", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
        durationTime: 7200,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 7200,
      });
    });

    it("should handle fractional seconds", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
        durationTime: 90.5,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 90.5,
      });
    });
  });

  describe("distance-based durations", () => {
    it("should convert FIT distance duration to meters", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance: 1000,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 1000,
      });
    });

    it("should handle zero meters", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance: 0,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 0,
      });
    });

    it("should handle large distance values", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance: 42195,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 42195,
      });
    });

    it("should handle fractional meters", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance: 1609.34,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 1609.34,
      });
    });
  });

  describe("open durations", () => {
    it("should convert FIT open duration", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.OPEN,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle missing duration type as open", () => {
      // Arrange
      const step: FitWorkoutStep = {};

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle unknown duration type as open", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: "unknown_type",
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle time duration type without durationTime value as open", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle distance duration type without durationDistance value as open", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle HR_LESS_THAN duration type as open", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.HR_LESS_THAN,
        durationHr: 150,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle REPEAT_UNTIL_STEPS_COMPLETE duration type as open", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE,
        durationStep: 5,
      };

      // Act
      const result = mapDuration(step);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("type validation", () => {
    it("should return Duration type for time duration", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.TIME,
        durationTime: 60,
      };

      // Act
      const result: Duration = mapDuration(step);

      // Assert
      expect(result.type).toBe("time");
      if (result.type === "time") {
        expect(result.seconds).toBe(60);
      }
    });

    it("should return Duration type for distance duration", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance: 500,
      };

      // Act
      const result: Duration = mapDuration(step);

      // Assert
      expect(result.type).toBe("distance");
      if (result.type === "distance") {
        expect(result.meters).toBe(500);
      }
    });

    it("should return Duration type for open duration", () => {
      // Arrange
      const step: FitWorkoutStep = {
        durationType: FIT_DURATION_TYPE.OPEN,
      };

      // Act
      const result: Duration = mapDuration(step);

      // Assert
      expect(result.type).toBe("open");
    });
  });
});

describe("mapDurationType", () => {
  it("should map FIT time duration type to KRD time", () => {
    // Arrange
    const fitType = FIT_DURATION_TYPE.TIME;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("time");
  });

  it("should map FIT distance duration type to KRD distance", () => {
    // Arrange
    const fitType = FIT_DURATION_TYPE.DISTANCE;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("distance");
  });

  it("should map FIT open duration type to KRD open", () => {
    // Arrange
    const fitType = FIT_DURATION_TYPE.OPEN;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("open");
  });

  it("should map undefined duration type to KRD open", () => {
    // Arrange
    const fitType = undefined;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("open");
  });

  it("should map unknown duration type to KRD open", () => {
    // Arrange
    const fitType = "unknown_type";

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("open");
  });

  it("should map HR_LESS_THAN duration type to KRD open", () => {
    // Arrange
    const fitType = FIT_DURATION_TYPE.HR_LESS_THAN;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("open");
  });

  it("should map REPEAT_UNTIL_STEPS_COMPLETE duration type to KRD open", () => {
    // Arrange
    const fitType = FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE;

    // Act
    const result = mapDurationType(fitType);

    // Assert
    expect(result).toBe("open");
  });
});
