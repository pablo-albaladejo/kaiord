import { describe, expect, it } from "vitest";
import { convertPaceTarget } from "./target-pace.converter";
import type { FitTargetData } from "./target.types";

describe("convertPaceTarget", () => {
  describe("range target using specific speed fields", () => {
    it("should return pace range when customTargetSpeedLow and High are set", () => {
      const data: FitTargetData = {
        customTargetSpeedLow: 3.0,
        customTargetSpeedHigh: 4.0,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.0 },
      });
    });
  });

  describe("range target using generic custom fields", () => {
    it("should return pace range when customTargetValueLow and High are set", () => {
      const data: FitTargetData = {
        customTargetValueLow: 2.5,
        customTargetValueHigh: 3.5,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 2.5, max: 3.5 },
      });
    });
  });

  describe("range target priority", () => {
    it("should prefer specific speed fields over generic custom fields", () => {
      const data: FitTargetData = {
        customTargetSpeedLow: 3.0,
        customTargetSpeedHigh: 4.0,
        customTargetValueLow: 2.5,
        customTargetValueHigh: 3.5,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.0 },
      });
    });
  });

  describe("zone target", () => {
    it("should return pace zone when targetSpeedZone is set", () => {
      const data: FitTargetData = {
        targetSpeedZone: 3,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should accept zone 1 (lower boundary)", () => {
      const result = convertPaceTarget({ targetSpeedZone: 1 });

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 1 },
      });
    });

    it("should accept zone 5 (upper boundary)", () => {
      const result = convertPaceTarget({ targetSpeedZone: 5 });

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 5 },
      });
    });

    it("should treat zone 0 as open (invalid zone, falls through)", () => {
      const result = convertPaceTarget({ targetSpeedZone: 0 });

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should treat zone 6 as mps (invalid zone, fallback)", () => {
      const result = convertPaceTarget({ targetSpeedZone: 6 });

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "mps", value: 6 },
      });
    });

    it("should treat zone 1299 as mps (invalid zone, fallback)", () => {
      const result = convertPaceTarget({ targetSpeedZone: 1299 });

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "mps", value: 1299 },
      });
    });
  });

  describe("value target", () => {
    it("should return pace value in mps when targetValue is set", () => {
      const data: FitTargetData = {
        targetValue: 3.5,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "mps", value: 3.5 },
      });
    });
  });

  describe("fallback priority", () => {
    it("should prefer range over zone", () => {
      const data: FitTargetData = {
        customTargetSpeedLow: 3.0,
        customTargetSpeedHigh: 4.0,
        targetSpeedZone: 3,
        targetValue: 3.5,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.0 },
      });
    });

    it("should prefer zone over value", () => {
      const data: FitTargetData = {
        targetSpeedZone: 3,
        targetValue: 3.5,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({
        type: "pace",
        value: { unit: "zone", value: 3 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when no pace data is present", () => {
      const data: FitTargetData = {};

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open when only low custom value is set (no high)", () => {
      const data: FitTargetData = {
        customTargetSpeedLow: 3.0,
      };

      const result = convertPaceTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
