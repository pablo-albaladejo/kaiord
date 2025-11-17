import { describe, expect, it } from "vitest";
import type { Target } from "../../../domain/schemas/target";
import { convertKrdTargetToTcx } from "./krd-to-tcx.converter";

describe("convertKrdTargetToTcx", () => {
  describe("heart rate targets", () => {
    it("should convert heart rate zone target", () => {
      // Arrange
      const target: Target = {
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 3,
        },
      });
    });

    it("should convert heart rate bpm target", () => {
      // Arrange
      const target: Target = {
        type: "heart_rate",
        value: {
          unit: "bpm",
          value: 150,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 150,
          High: 150,
        },
      });
    });

    it("should convert heart rate range target", () => {
      // Arrange
      const target: Target = {
        type: "heart_rate",
        value: {
          unit: "range",
          min: 140,
          max: 160,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 140,
          High: 160,
        },
      });
    });
  });

  describe("pace targets", () => {
    it("should convert pace zone target", () => {
      // Arrange
      const target: Target = {
        type: "pace",
        value: {
          unit: "zone",
          value: 3.5,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Speed_t",
        SpeedZone: {
          "@_xsi:type": "CustomSpeedZone_t",
          LowInMetersPerSecond: 3.5,
          HighInMetersPerSecond: 3.5,
        },
      });
    });

    it("should convert pace mps target", () => {
      // Arrange
      const target: Target = {
        type: "pace",
        value: {
          unit: "mps",
          value: 4.2,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Speed_t",
        SpeedZone: {
          "@_xsi:type": "CustomSpeedZone_t",
          LowInMetersPerSecond: 4.2,
          HighInMetersPerSecond: 4.2,
        },
      });
    });

    it("should convert pace range target", () => {
      // Arrange
      const target: Target = {
        type: "pace",
        value: {
          unit: "range",
          min: 3.0,
          max: 4.0,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Speed_t",
        SpeedZone: {
          "@_xsi:type": "CustomSpeedZone_t",
          LowInMetersPerSecond: 3.0,
          HighInMetersPerSecond: 4.0,
        },
      });
    });
  });

  describe("cadence targets", () => {
    it("should convert cadence rpm target for cycling", () => {
      // Arrange
      const target: Target = {
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target, sport: "cycling" });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 90,
          High: 90,
        },
      });
    });

    it("should convert cadence rpm target for running (doubles value)", () => {
      // Arrange
      const target: Target = {
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target, sport: "running" });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 180,
          High: 180,
        },
      });
    });

    it("should convert cadence range target for cycling", () => {
      // Arrange
      const target: Target = {
        type: "cadence",
        value: {
          unit: "range",
          min: 80,
          max: 100,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target, sport: "cycling" });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 80,
          High: 100,
        },
      });
    });

    it("should convert cadence range target for running (doubles values)", () => {
      // Arrange
      const target: Target = {
        type: "cadence",
        value: {
          unit: "range",
          min: 80,
          max: 100,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target, sport: "running" });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 160,
          High: 200,
        },
      });
    });
  });

  describe("open target", () => {
    it("should convert open target to None", () => {
      // Arrange
      const target: Target = {
        type: "open",
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "None_t",
      });
    });
  });

  describe("unsupported targets", () => {
    it("should convert power target to None (not supported in TCX)", () => {
      // Arrange
      const target: Target = {
        type: "power",
        value: {
          unit: "watts",
          value: 250,
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "None_t",
      });
    });

    it("should convert stroke_type target to None (not supported in TCX)", () => {
      // Arrange
      const target: Target = {
        type: "stroke_type",
        value: {
          unit: "swim_stroke",
          value: 0, // 0 = freestyle
        },
      };

      // Act
      const result = convertKrdTargetToTcx({ target });

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "None_t",
      });
    });
  });
});
