import { describe, expect, it } from "vitest";
import type { Target } from "../../../domain/schemas/target";
import { convertTcxTarget, type TcxTargetData } from "./target.converter";

describe("convertTcxTarget", () => {
  describe("heart rate targets", () => {
    it("should convert heart rate zone target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 3,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      });
    });

    it("should convert heart rate range target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateLow: 120,
        heartRateHigh: 160,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "range",
          min: 120,
          max: 160,
        },
      });
    });

    it("should convert heart rate zone 1", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 1,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 1,
        },
      });
    });

    it("should convert heart rate zone 5", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 5,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 5,
        },
      });
    });

    it("should handle low heart rate range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateLow: 60,
        heartRateHigh: 100,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "range",
          min: 60,
          max: 100,
        },
      });
    });

    it("should handle high heart rate range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateLow: 160,
        heartRateHigh: 190,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "range",
          min: 160,
          max: 190,
        },
      });
    });

    it("should return open target when heart rate has no zone or range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("speed targets", () => {
    it("should convert speed zone target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 3,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 3,
        },
      });
    });

    it("should convert speed range target", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedLow: 3.0,
        speedHigh: 4.0,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "range",
          min: 3.0,
          max: 4.0,
        },
      });
    });

    it("should convert speed zone 1", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 1,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 1,
        },
      });
    });

    it("should convert speed zone 5", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 5,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 5,
        },
      });
    });

    it("should handle slow speed range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedLow: 1.5,
        speedHigh: 2.5,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "range",
          min: 1.5,
          max: 2.5,
        },
      });
    });

    it("should handle fast speed range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedLow: 5.0,
        speedHigh: 6.0,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "range",
          min: 5.0,
          max: 6.0,
        },
      });
    });

    it("should return open target when speed has no zone or range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("cadence targets", () => {
    it("should convert cadence range target for cycling", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
        sport: "cycling",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 80,
          max: 100,
        },
      });
    });

    it("should convert cadence range target for running with spm to rpm conversion", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 160,
        cadenceHigh: 180,
        sport: "running",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 80,
          max: 90,
        },
      });
    });

    it("should convert cadence range target for Running with capital R", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 170,
        cadenceHigh: 190,
        sport: "Running",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 85,
          max: 95,
        },
      });
    });

    it("should handle low cadence range for cycling", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 60,
        cadenceHigh: 70,
        sport: "cycling",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 60,
          max: 70,
        },
      });
    });

    it("should handle high cadence range for cycling", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 110,
        cadenceHigh: 130,
        sport: "cycling",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 110,
          max: 130,
        },
      });
    });

    it("should handle cadence without sport context as cycling", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 85,
        cadenceHigh: 95,
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 85,
          max: 95,
        },
      });
    });

    it("should return open target when cadence has no range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("open targets", () => {
    it("should convert None target type to open", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "None",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle missing target type as open", () => {
      // Arrange
      const data: TcxTargetData = {};

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle unknown target type as open", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Unknown",
      };

      // Act
      const result = convertTcxTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("type validation", () => {
    it("should return Target type for heart rate zone", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "HeartRate",
        heartRateZone: 2,
      };

      // Act
      const result: Target = convertTcxTarget(data);

      // Assert
      expect(result.type).toBe("heart_rate");
    });

    it("should return Target type for speed zone", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Speed",
        speedZone: 3,
      };

      // Act
      const result: Target = convertTcxTarget(data);

      // Assert
      expect(result.type).toBe("pace");
    });

    it("should return Target type for cadence range", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "Cadence",
        cadenceLow: 80,
        cadenceHigh: 100,
      };

      // Act
      const result: Target = convertTcxTarget(data);

      // Assert
      expect(result.type).toBe("cadence");
    });

    it("should return Target type for open", () => {
      // Arrange
      const data: TcxTargetData = {
        targetType: "None",
      };

      // Act
      const result: Target = convertTcxTarget(data);

      // Assert
      expect(result.type).toBe("open");
    });
  });
});
