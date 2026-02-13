import { describe, expect, it } from "vitest";
import { convertHeartRateTarget } from "./target-heart-rate.converter";
import type { FitTargetData } from "./target.types";

describe("convertHeartRateTarget", () => {
  describe("range target using specific HR fields", () => {
    it("should return HR range when customTargetHeartRateLow and High are set", () => {
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });
  });

  describe("range target using generic custom fields", () => {
    it("should return HR range when customTargetValueLow and High are set", () => {
      const data: FitTargetData = {
        customTargetValueLow: 110,
        customTargetValueHigh: 150,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 110, max: 150 },
      });
    });
  });

  describe("range target priority", () => {
    it("should prefer specific HR fields over generic custom fields", () => {
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
        customTargetValueLow: 110,
        customTargetValueHigh: 150,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });
  });

  describe("zone target", () => {
    it("should return HR zone for valid zone value (1-5)", () => {
      const data: FitTargetData = {
        targetHrZone: 3,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should return HR zone for zone 1 (lower boundary)", () => {
      const data: FitTargetData = {
        targetHrZone: 1,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 1 },
      });
    });

    it("should return HR zone for zone 5 (upper boundary)", () => {
      const data: FitTargetData = {
        targetHrZone: 5,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 5 },
      });
    });

    it("should treat invalid zone > 5 as BPM value (via convertHeartRateValue)", () => {
      // Zone 6 is invalid, so it falls through to convertHeartRateValue
      // 6 is 0 < 6 <= 100, so it's treated as percent_max
      const data: FitTargetData = {
        targetHrZone: 6,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 6 },
      });
    });

    it("should treat invalid zone 0 as open target (via convertHeartRateValue)", () => {
      const data: FitTargetData = {
        targetHrZone: 0,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should treat high invalid zone as BPM (value > 100)", () => {
      // Zone 150 is invalid; > 100 means absolute BPM offset: 150 - 100 = 50 bpm
      const data: FitTargetData = {
        targetHrZone: 150,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 50 },
      });
    });
  });

  describe("value target (targetValue)", () => {
    it("should return BPM for targetValue > 100 (offset encoding)", () => {
      // 225 => 225 - 100 = 125 bpm
      const data: FitTargetData = {
        targetValue: 225,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 125 },
      });
    });

    it("should return percent_max for targetValue between 1 and 100", () => {
      const data: FitTargetData = {
        targetValue: 85,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 85 },
      });
    });

    it("should return open for targetValue of 0", () => {
      const data: FitTargetData = {
        targetValue: 0,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return BPM for boundary value 101", () => {
      // 101 > 100, so absolute bpm: 101 - 100 = 1 bpm
      const data: FitTargetData = {
        targetValue: 101,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 1 },
      });
    });

    it("should return percent_max for boundary value 100", () => {
      // 100 is not > 100, but is > 0 => percent_max
      const data: FitTargetData = {
        targetValue: 100,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "percent_max", value: 100 },
      });
    });
  });

  describe("fallback priority", () => {
    it("should prefer range over zone", () => {
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
        customTargetHeartRateHigh: 160,
        targetHrZone: 3,
        targetValue: 225,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 160 },
      });
    });

    it("should prefer zone over value", () => {
      const data: FitTargetData = {
        targetHrZone: 3,
        targetValue: 225,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when no heart rate data is present", () => {
      const data: FitTargetData = {};

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open when only low custom value is set (no high)", () => {
      const data: FitTargetData = {
        customTargetHeartRateLow: 120,
      };

      const result = convertHeartRateTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
