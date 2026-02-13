import { describe, expect, it } from "vitest";
import { convertCadenceTarget } from "./target-cadence.converter";
import type { FitTargetData } from "./target.types";

describe("convertCadenceTarget", () => {
  describe("range target using specific cadence fields", () => {
    it("should return cadence range when customTargetCadenceLow and High are set", () => {
      const data: FitTargetData = {
        customTargetCadenceLow: 80,
        customTargetCadenceHigh: 100,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("range target using generic custom fields", () => {
    it("should return cadence range when customTargetValueLow and High are set", () => {
      const data: FitTargetData = {
        customTargetValueLow: 70,
        customTargetValueHigh: 90,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 70, max: 90 },
      });
    });
  });

  describe("range target priority", () => {
    it("should prefer specific cadence fields over generic custom fields", () => {
      const data: FitTargetData = {
        customTargetCadenceLow: 80,
        customTargetCadenceHigh: 100,
        customTargetValueLow: 70,
        customTargetValueHigh: 90,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("zone target", () => {
    it("should return cadence zone when targetCadenceZone is set", () => {
      const data: FitTargetData = {
        targetCadenceZone: 3,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "rpm", value: 3 },
      });
    });
  });

  describe("value target", () => {
    it("should return cadence value when targetValue is set", () => {
      const data: FitTargetData = {
        targetValue: 90,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "rpm", value: 90 },
      });
    });
  });

  describe("fallback priority", () => {
    it("should prefer range over zone", () => {
      const data: FitTargetData = {
        customTargetCadenceLow: 80,
        customTargetCadenceHigh: 100,
        targetCadenceZone: 3,
        targetValue: 90,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });

    it("should prefer zone over value", () => {
      const data: FitTargetData = {
        targetCadenceZone: 3,
        targetValue: 90,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({
        type: "cadence",
        value: { unit: "rpm", value: 3 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when no cadence data is present", () => {
      const data: FitTargetData = {};

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open when only low custom value is set (no high)", () => {
      const data: FitTargetData = {
        customTargetCadenceLow: 80,
      };

      const result = convertCadenceTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
