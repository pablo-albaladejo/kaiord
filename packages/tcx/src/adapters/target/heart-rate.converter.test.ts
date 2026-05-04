import { describe, expect, it } from "vitest";

import { convertHeartRateZone } from "./heart-rate.converter";

describe("convertHeartRateZone", () => {
  describe("zone unit", () => {
    it("should convert zone to PredefinedHeartRateZone_t", () => {
      // Arrange
      const value = { unit: "zone", value: 3 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 3,
        },
      });
    });

    it("should convert zone 1", () => {
      // Arrange
      const value = { unit: "zone", value: 1 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 1,
        },
      });
    });

    it("should convert zone 5", () => {
      // Arrange
      const value = { unit: "zone", value: 5 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "PredefinedHeartRateZone_t",
          Number: 5,
        },
      });
    });

    it("should throw when zone value is undefined", () => {
      // Arrange

      // Act
      const value = { unit: "zone" };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "zone unit requires value to be defined"
      );
    });
  });

  describe("range unit", () => {
    it("should convert range to CustomHeartRateZone_t", () => {
      // Arrange
      const value = { unit: "range", min: 120, max: 160 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 120,
          High: 160,
        },
      });
    });

    it("should throw when range min is undefined", () => {
      // Arrange

      // Act
      const value = { unit: "range", max: 160 };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "range unit requires min and max to be defined"
      );
    });

    it("should throw when range max is undefined", () => {
      // Arrange

      // Act
      const value = { unit: "range", min: 120 };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "range unit requires min and max to be defined"
      );
    });

    it("should throw when both range values are undefined", () => {
      // Arrange

      // Act
      const value = { unit: "range" };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "range unit requires min and max to be defined"
      );
    });
  });

  describe("bpm unit", () => {
    it("should convert bpm to CustomHeartRateZone_t with same low and high", () => {
      // Arrange
      const value = { unit: "bpm", value: 150 };

      // Act
      const result = convertHeartRateZone(value);

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

    it("should throw when bpm value is undefined", () => {
      // Arrange

      // Act
      const value = { unit: "bpm" };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "bpm unit requires value to be defined"
      );
    });
  });

  describe("percent_max unit", () => {
    it("should convert percent_max to CustomHeartRateZone_t", () => {
      // Arrange
      const value = { unit: "percent_max", value: 80 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({
        "@_xsi:type": "HeartRate_t",
        HeartRateZone: {
          "@_xsi:type": "CustomHeartRateZone_t",
          Low: 80,
          High: 80,
        },
      });
    });

    it("should throw when percent_max value is undefined", () => {
      // Arrange

      // Act
      const value = { unit: "percent_max" };

      // Assert
      expect(() => convertHeartRateZone(value)).toThrow(
        "percent_max unit requires value to be defined"
      );
    });
  });

  describe("unsupported units", () => {
    it("should return None_t for unknown unit", () => {
      // Arrange
      const value = { unit: "unknown", value: 100 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });

    it("should return None_t for empty unit string", () => {
      // Arrange
      const value = { unit: "", value: 100 };

      // Act
      const result = convertHeartRateZone(value);

      // Assert
      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });
  });
});
