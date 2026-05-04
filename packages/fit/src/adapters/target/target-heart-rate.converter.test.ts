import { describe, expect, it } from "vitest";

import type { FitTargetData } from "./target.types";
import { convertHeartRateTarget } from "./target-heart-rate.converter";

describe("convertHeartRateTarget", () => {
  describe("range target using specific HR fields", () => {
    it("should return HR range when customTargetHeartRateLow and High are set", () => {
      // Arrange
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });
  });

  describe("range target using generic custom fields", () => {
    it("should return HR range when customTargetValueLow and High are set", () => {
      // Arrange
      const data: FitTargetData = {
        customTargetValueLow: 110,
        customTargetValueHigh: 150,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 110, max: 150 },
      });
    });
  });

  describe("range target priority", () => {
    it("should prefer specific HR fields over generic custom fields", () => {
      // Arrange
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
        customTargetValueLow: 110,
        customTargetValueHigh: 150,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });
  });

  describe("zone target", () => {
    it("should return HR zone for valid zone value (1-5)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 3,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should return HR zone for zone 1 (lower boundary)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 1,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 1 },
      });
    });

    it("should return HR zone for zone 5 (upper boundary)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 5,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 5 },
      });
    });

    it("should treat invalid zone > 5 as percent_max (via convertHeartRateValue)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 6,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 6 },
      });
    });

    it("should treat invalid zone 0 as open target (via convertHeartRateValue)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 0,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should treat high invalid zone as BPM (value > 100)", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 150,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 50 },
      });
    });
  });

  describe("value target (targetValue)", () => {
    it("should return BPM for targetValue > 100 (offset encoding)", () => {
      // Arrange
      const data: FitTargetData = {
        targetValue: 225,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 125 },
      });
    });

    it("should return percent_max for targetValue between 1 and 100", () => {
      // Arrange
      const data: FitTargetData = {
        targetValue: 85,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 85 },
      });
    });

    it("should return open for targetValue of 0", () => {
      // Arrange
      const data: FitTargetData = {
        targetValue: 0,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return BPM for boundary value 101", () => {
      // Arrange
      const data: FitTargetData = {
        targetValue: 101,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 1 },
      });
    });

    it("should return percent_max for boundary value 100", () => {
      // Arrange
      const data: FitTargetData = {
        targetValue: 100,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 100 },
      });
    });
  });

  describe("fallback priority", () => {
    it("should prefer range over zone", () => {
      // Arrange
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
        targetHrZone: 3,
        targetValue: 225,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should prefer zone over value", () => {
      // Arrange
      const data: FitTargetData = {
        targetHrZone: 3,
        targetValue: 225,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when no heart rate data is present", () => {
      // Arrange
      const data: FitTargetData = {};

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open when only low custom value is set (no high)", () => {
      // Arrange
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
      };

      // Act
      const result = convertHeartRateTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
