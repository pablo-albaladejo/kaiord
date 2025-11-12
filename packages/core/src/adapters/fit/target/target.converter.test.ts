import { describe, expect, it } from "vitest";
import type { Target } from "../../../domain/schemas/target";
import { buildFitTargetData } from "../../../tests/fixtures/fit-target.fixtures";
import { convertFitTarget } from "./target.converter";

describe("convertFitTarget", () => {
  describe("power targets", () => {
    it("should convert absolute power target in watts", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: 250,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "watts",
          value: 250,
        },
      });
    });

    it("should convert FTP-based power target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: 1085,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 85,
        },
      });
    });

    it("should convert power zone target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetPowerZone: 3,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "zone",
          value: 3,
        },
      });
    });

    it("should convert power range target using custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        customTargetPowerLow: 200,
        customTargetPowerHigh: 250,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: 200,
          max: 250,
        },
      });
    });

    it("should convert power range target using generic custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        customTargetValueLow: 180,
        customTargetValueHigh: 220,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: 180,
          max: 220,
        },
      });
    });

    it("should handle zero watts", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: 0,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle high wattage values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: 500,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "watts",
          value: 500,
        },
      });
    });

    it("should handle power zone 1", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetPowerZone: 1,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "zone",
          value: 1,
        },
      });
    });

    it("should handle power zone 7", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetPowerZone: 7,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "zone",
          value: 7,
        },
      });
    });
  });

  describe("heart rate targets", () => {
    it("should convert absolute heart rate target in bpm", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: 85,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "bpm",
          value: 85,
        },
      });
    });

    it("should convert heart rate zone target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetHrZone: 3,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      });
    });

    it("should convert heart rate range target using custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
      });

      // Act
      const result = convertFitTarget(data);

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

    it("should convert heart rate range target using generic custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        customTargetValueLow: 110,
        customTargetValueHigh: 150,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "range",
          min: 110,
          max: 150,
        },
      });
    });

    it("should handle percentage of max heart rate", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: 150,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "percent_max",
          value: 150,
        },
      });
    });

    it("should handle heart rate zone 1", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetHrZone: 1,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 1,
        },
      });
    });

    it("should handle heart rate zone 5", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetHrZone: 5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 5,
        },
      });
    });

    it("should handle low heart rate values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: 60,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "bpm",
          value: 60,
        },
      });
    });

    it("should handle high heart rate values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: 200,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: {
          unit: "percent_max",
          value: 200,
        },
      });
    });
  });

  describe("cadence targets", () => {
    it("should convert cadence target in rpm", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetValue: 90,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      });
    });

    it("should convert cadence zone target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetCadenceZone: 3,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 3,
        },
      });
    });

    it("should convert cadence range target using custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        customTargetCadenceLow: 80,
        customTargetCadenceHigh: 100,
      });

      // Act
      const result = convertFitTarget(data);

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

    it("should convert cadence range target using generic custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        customTargetValueLow: 70,
        customTargetValueHigh: 90,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "range",
          min: 70,
          max: 90,
        },
      });
    });

    it("should handle low cadence values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetValue: 60,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 60,
        },
      });
    });

    it("should handle high cadence values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetValue: 120,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 120,
        },
      });
    });
  });

  describe("pace targets", () => {
    it("should convert pace target in m/s", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetValue: 3.5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 3.5,
        },
      });
    });

    it("should convert pace zone target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetSpeedZone: 3,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 3,
        },
      });
    });

    it("should convert pace range target using custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        customTargetSpeedLow: 3.0,
        customTargetSpeedHigh: 4.0,
      });

      // Act
      const result = convertFitTarget(data);

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

    it("should convert pace range target using generic custom fields", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        customTargetValueLow: 2.5,
        customTargetValueHigh: 3.5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "range",
          min: 2.5,
          max: 3.5,
        },
      });
    });

    it("should handle slow pace values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetValue: 1.5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 1.5,
        },
      });
    });

    it("should handle fast pace values", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetValue: 6.0,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 6.0,
        },
      });
    });

    it("should handle pace zone 1", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetSpeedZone: 1,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 1,
        },
      });
    });

    it("should handle pace zone 5", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetSpeedZone: 5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "zone",
          value: 5,
        },
      });
    });
  });

  describe("open targets", () => {
    it("should convert open target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "open",
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle missing target type as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle unknown target type as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "unknown",
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle power target without value as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: undefined,
        targetPowerZone: undefined,
        customTargetPowerLow: undefined,
        customTargetPowerHigh: undefined,
        customTargetValueLow: undefined,
        customTargetValueHigh: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle heart rate target without value as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: undefined,
        targetHrZone: undefined,
        customTargetHeartRateLow: undefined,
        customTargetHeartRateHigh: undefined,
        customTargetValueLow: undefined,
        customTargetValueHigh: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle cadence target without value as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetValue: undefined,
        targetCadenceZone: undefined,
        customTargetCadenceLow: undefined,
        customTargetCadenceHigh: undefined,
        customTargetValueLow: undefined,
        customTargetValueHigh: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });

    it("should handle pace target without value as open", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetValue: undefined,
        targetSpeedZone: undefined,
        customTargetSpeedLow: undefined,
        customTargetSpeedHigh: undefined,
        customTargetValueLow: undefined,
        customTargetValueHigh: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });

  describe("type validation", () => {
    it("should return Target type for power target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "power",
        targetValue: 250,
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("power");
    });

    it("should return Target type for heart rate target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "heartRate",
        targetValue: 150,
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("heart_rate");
    });

    it("should return Target type for cadence target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "cadence",
        targetValue: 90,
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("cadence");
    });

    it("should return Target type for pace target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "speed",
        targetValue: 3.5,
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("pace");
    });

    it("should return Target type for open target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "open",
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("open");
    });

    it("should return Target type for stroke_type target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 0,
      });

      // Act
      const result: Target = convertFitTarget(data);

      // Assert
      expect(result.type).toBe("stroke_type");
    });
  });

  describe("stroke_type targets", () => {
    it("should convert freestyle stroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 0,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 0,
        },
      });
    });

    it("should convert backstroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 1,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 1,
        },
      });
    });

    it("should convert breaststroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 2,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 2,
        },
      });
    });

    it("should convert butterfly stroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 3,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 3,
        },
      });
    });

    it("should convert drill stroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 4,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 4,
        },
      });
    });

    it("should convert mixed/IM stroke target", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: 5,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 5,
        },
      });
    });

    it("should return open target when targetSwimStroke is undefined", () => {
      // Arrange
      const data = buildFitTargetData.build({
        targetType: "swimStroke",
        targetSwimStroke: undefined,
      });

      // Act
      const result = convertFitTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "open",
      });
    });
  });
});
