import { describe, expect, it } from "vitest";
import type { Duration } from "../../domain/schemas/duration";
import { buildFitDurationData } from "../../tests/fixtures/fit-duration.fixtures";
import { convertFitDuration } from "./duration.converter";

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

  describe("edge cases", () => {
    it("should handle HR_LESS_THAN duration type as open", () => {
      // Arrange
      const data = buildFitDurationData.build({
        durationType: "hrLessThan",
        durationHr: 150,
      });

      // Act
      const result = convertFitDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
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
});
