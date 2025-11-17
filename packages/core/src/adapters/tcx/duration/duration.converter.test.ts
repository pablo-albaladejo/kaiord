import { describe, expect, it } from "vitest";
import { convertTcxDuration } from "./duration.converter";

describe("convertTcxDuration", () => {
  describe("time-based durations", () => {
    it("should convert TCX time duration to seconds", () => {
      // Arrange
      const data = {
        durationType: "Time",
        seconds: 300,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "time",
          seconds: 300,
        },
      });
    });

    it("should handle zero seconds", () => {
      // Arrange
      const data = {
        durationType: "Time",
        seconds: 0,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "time",
          seconds: 0,
        },
      });
    });

    it("should handle large time values", () => {
      // Arrange
      const data = {
        durationType: "Time",
        seconds: 7200,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "time",
          seconds: 7200,
        },
      });
    });

    it("should handle fractional seconds", () => {
      // Arrange
      const data = {
        durationType: "Time",
        seconds: 90.5,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "time",
          seconds: 90.5,
        },
      });
    });
  });

  describe("distance-based durations", () => {
    it("should convert TCX distance duration to meters", () => {
      // Arrange
      const data = {
        durationType: "Distance",
        meters: 1000,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "distance",
          meters: 1000,
        },
      });
    });

    it("should handle zero meters", () => {
      // Arrange
      const data = {
        durationType: "Distance",
        meters: 0,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "distance",
          meters: 0,
        },
      });
    });

    it("should handle large distance values", () => {
      // Arrange
      const data = {
        durationType: "Distance",
        meters: 42195,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "distance",
          meters: 42195,
        },
      });
    });

    it("should handle fractional meters", () => {
      // Arrange
      const data = {
        durationType: "Distance",
        meters: 1609.34,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "distance",
          meters: 1609.34,
        },
      });
    });
  });

  describe("lap button durations", () => {
    it("should convert TCX LapButton duration to open", () => {
      // Arrange
      const data = {
        durationType: "LapButton",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });
  });

  describe("heart rate conditional durations", () => {
    it("should convert HeartRateAbove to extensions", () => {
      // Arrange
      const data = {
        durationType: "HeartRateAbove",
        bpm: 160,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
        extensions: {
          heartRateAbove: 160,
        },
      });
    });

    it("should convert HeartRateBelow to extensions", () => {
      // Arrange
      const data = {
        durationType: "HeartRateBelow",
        bpm: 120,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
        extensions: {
          heartRateBelow: 120,
        },
      });
    });

    it("should handle HeartRateAbove without bpm value", () => {
      // Arrange
      const data = {
        durationType: "HeartRateAbove",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should handle HeartRateBelow without bpm value", () => {
      // Arrange
      const data = {
        durationType: "HeartRateBelow",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });
  });

  describe("calorie-based durations", () => {
    it("should convert CaloriesBurned to extensions", () => {
      // Arrange
      const data = {
        durationType: "CaloriesBurned",
        calories: 500,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
        extensions: {
          caloriesBurned: 500,
        },
      });
    });

    it("should handle CaloriesBurned without calories value", () => {
      // Arrange
      const data = {
        durationType: "CaloriesBurned",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should handle large calorie values", () => {
      // Arrange
      const data = {
        durationType: "CaloriesBurned",
        calories: 2000,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
        extensions: {
          caloriesBurned: 2000,
        },
      });
    });
  });

  describe("validation", () => {
    it("should return open duration for invalid duration type", () => {
      // Arrange
      const data = {
        durationType: "InvalidType",
        seconds: 300,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should return open duration for missing duration type", () => {
      // Arrange
      const data = {
        seconds: 300,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should return open duration for null duration type", () => {
      // Arrange
      const data = {
        durationType: null as unknown as string,
        seconds: 300,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should return open duration for numeric duration type", () => {
      // Arrange
      const data = {
        durationType: 123 as unknown as string,
        seconds: 300,
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });
  });

  describe("edge cases", () => {
    it("should handle Time duration without seconds value as open", () => {
      // Arrange
      const data = {
        durationType: "Time",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should handle Distance duration without meters value as open", () => {
      // Arrange
      const data = {
        durationType: "Distance",
      };

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });

    it("should handle empty data object", () => {
      // Arrange
      const data = {};

      // Act
      const result = convertTcxDuration(data);

      // Assert
      expect(result).toStrictEqual({
        duration: {
          type: "open",
        },
      });
    });
  });
});
