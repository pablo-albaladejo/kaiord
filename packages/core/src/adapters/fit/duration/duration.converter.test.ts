import { describe, expect, it } from "vitest";
import type { Duration } from "../../../domain/schemas/duration";
import { buildFitDurationData } from "../../../tests/fixtures/fit-duration.fixtures";
import { convertFitDuration } from "../duration/duration.converter";

describe("convertFitDuration", () => {
  describe("time-based durations", () => {
    it("should convert FIT time duration to seconds", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 300,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 300,
      });
    });

    it("should handle zero seconds", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 0,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 0,
      });
    });

    it("should handle large time values", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 7200,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 7200,
      });
    });

    it("should handle fractional seconds", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 90.5,
      });

      // Act
      const result = convertFitDuration(data);

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
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 1000,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 1000,
      });
    });

    it("should handle zero meters", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 0,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 0,
      });
    });

    it("should handle large distance values", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 42195,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 42195,
      });
    });

    it("should handle fractional meters", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 1609.34,
      });

      // Act
      const result = convertFitDuration(data);

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
      const data = buildFitDurationData.build({
        durationType: "open",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle missing duration type as open", () => {
      // Arrange
      const data = buildFitDurationData.build({});

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle unknown duration type as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "unknown_type",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle time duration type without durationTime value as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle distance duration type without durationDistance value as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("validation", () => {
    it("should return open duration for invalid duration type", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "invalid_type",
        durationTime: 300,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should return open duration for null duration type", () => {
      // Arrange
      const data = {
        durationType: null as unknown as string,
        durationTime: 300,
      };

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should return open duration for numeric duration type", () => {
      // Arrange
      const data = {
        durationType: 123 as unknown as string,
        durationTime: 300,
      };

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should validate and convert valid time duration type", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 600,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "time",
        seconds: 600,
      });
    });

    it("should validate and convert valid distance duration type", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 5000,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "distance",
        meters: 5000,
      });
    });

    it("should validate and convert valid hrLessThan duration type", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "hrLessThan",
        durationHr: 140,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate_less_than",
        bpm: 140,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle HR_LESS_THAN duration type correctly", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "hrLessThan",
        durationHr: 150,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate_less_than",
        bpm: 150,
      });
    });

    it("should handle REPEAT_UNTIL_STEPS_COMPLETE duration type as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilStepsCmplt",
        durationStep: 5,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("type validation", () => {
    it("should return Duration type for time duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "time",
        durationTime: 60,
      });

      // Act
      const result: Duration = convertFitDuration(data);

      // Assert
      expect(result.type).toBe("time");
      if (result.type === "time") {
        expect(result.seconds).toBe(60);
      }
    });

    it("should return Duration type for distance duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "distance",
        durationDistance: 500,
      });

      // Act
      const result: Duration = convertFitDuration(data);

      // Assert
      expect(result.type).toBe("distance");
      if (result.type === "distance") {
        expect(result.meters).toBe(500);
      }
    });

    it("should return Duration type for open duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "open",
      });

      // Act
      const result: Duration = convertFitDuration(data);

      // Assert
      expect(result.type).toBe("open");
    });
  });

  describe("calorie-based durations", () => {
    it("should convert FIT calories duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "calories",
        durationCalories: 500,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "calories",
        calories: 500,
      });
    });

    it("should convert FIT repeatUntilCalories duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilCalories",
        durationCalories: 1000,
        durationStep: 2,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_calories",
        calories: 1000,
        repeatFrom: 2,
      });
    });

    it("should handle calories duration without value as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "calories",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle repeatUntilCalories without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilCalories",
        durationCalories: 800,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("power-based durations", () => {
    it("should convert FIT powerLessThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "powerLessThan",
        durationPower: 200,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power_less_than",
        watts: 200,
      });
    });

    it("should convert FIT powerGreaterThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "powerGreaterThan",
        durationPower: 250,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power_greater_than",
        watts: 250,
      });
    });

    it("should convert FIT repeatUntilPowerLessThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilPowerLessThan",
        durationPower: 180,
        durationStep: 3,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_power_less_than",
        watts: 180,
        repeatFrom: 3,
      });
    });

    it("should convert FIT repeatUntilPowerGreaterThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilPowerGreaterThan",
        durationPower: 300,
        durationStep: 1,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_power_greater_than",
        watts: 300,
        repeatFrom: 1,
      });
    });

    it("should handle powerLessThan duration without value as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "powerLessThan",
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle repeatUntilPowerLessThan without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilPowerLessThan",
        durationPower: 150,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("repeat conditional durations", () => {
    it("should convert FIT repeatUntilTime duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilTime",
        durationTime: 1800,
        durationStep: 0,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_time",
        seconds: 1800,
        repeatFrom: 0,
      });
    });

    it("should convert FIT repeatUntilDistance duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilDistance",
        durationDistance: 5000,
        durationStep: 1,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_distance",
        meters: 5000,
        repeatFrom: 1,
      });
    });

    it("should convert FIT repeatUntilHrLessThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilHrLessThan",
        durationHr: 120,
        durationStep: 2,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_heart_rate_less_than",
        bpm: 120,
        repeatFrom: 2,
      });
    });

    it("should handle repeatUntilTime without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilTime",
        durationTime: 600,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle repeatUntilDistance without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilDistance",
        durationDistance: 3000,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle repeatUntilHrLessThan without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilHrLessThan",
        durationHr: 130,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("repeatUntilHrGreaterThan duration", () => {
    it("should convert FIT repeatUntilHrGreaterThan duration", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilHrGreaterThan",
        repeatHr: 160,
        durationStep: 0,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "repeat_until_heart_rate_greater_than",
        bpm: 160,
        repeatFrom: 0,
      });
    });

    it("should handle repeatUntilHrGreaterThan without durationStep as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilHrGreaterThan",
        repeatHr: 170,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle repeatUntilHrGreaterThan without repeatHr as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "repeatUntilHrGreaterThan",
        durationStep: 1,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });
});
