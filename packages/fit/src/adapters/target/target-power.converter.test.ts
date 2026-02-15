import { describe, expect, it } from "vitest";
import { convertPowerTarget } from "./target-power.converter";
import type { FitTargetData } from "./target.types";

describe("convertPowerTarget", () => {
  describe("range target using specific power fields", () => {
    it("should return power range with interpreted values for customTargetPowerLow/High", () => {
      // Values < 1000 are percentage of FTP
      const data: FitTargetData = {
        customTargetPowerLow: 200,
        customTargetPowerHigh: 250,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should interpret absolute watts for high values (>= 1000 offset)", () => {
      // 1200 => watts: 200, 1300 => watts: 300
      const data: FitTargetData = {
        customTargetPowerLow: 1200,
        customTargetPowerHigh: 1300,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 300 },
      });
    });
  });

  describe("range target using generic custom fields", () => {
    it("should return power range for customTargetValueLow/High", () => {
      const data: FitTargetData = {
        customTargetValueLow: 180,
        customTargetValueHigh: 220,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 180, max: 220 },
      });
    });
  });

  describe("range target priority", () => {
    it("should prefer specific power fields over generic custom fields", () => {
      const data: FitTargetData = {
        customTargetPowerLow: 200,
        customTargetPowerHigh: 250,
        customTargetValueLow: 180,
        customTargetValueHigh: 220,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });
  });

  describe("zone target", () => {
    it("should return power zone when targetPowerZone is set", () => {
      const data: FitTargetData = {
        targetPowerZone: 4,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 4 },
      });
    });

    it("should accept zone 1 (lower boundary)", () => {
      const result = convertPowerTarget({ targetPowerZone: 1 });

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 1 },
      });
    });

    it("should accept zone 7 (upper boundary)", () => {
      const result = convertPowerTarget({ targetPowerZone: 7 });

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 7 },
      });
    });

    it("should treat zone 0 as open (invalid zone, convertPowerValue returns null)", () => {
      const result = convertPowerTarget({ targetPowerZone: 0 });

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should treat zone 8 as percent_ftp (invalid zone, fallback)", () => {
      const result = convertPowerTarget({ targetPowerZone: 8 });

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "percent_ftp", value: 8 },
      });
    });

    it("should treat zone 1299 as watts (invalid zone, value > 1000)", () => {
      const result = convertPowerTarget({ targetPowerZone: 1299 });

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "watts", value: 299 },
      });
    });
  });

  describe("value target", () => {
    it("should return absolute watts for targetValue > 1000", () => {
      // 1325 => 325 watts
      const data: FitTargetData = {
        targetValue: 1325,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "watts", value: 325 },
      });
    });

    it("should return percent FTP for targetValue between 1 and 1000", () => {
      const data: FitTargetData = {
        targetValue: 85,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "percent_ftp", value: 85 },
      });
    });

    it("should return open for targetValue of 0", () => {
      const data: FitTargetData = {
        targetValue: 0,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("fallback priority", () => {
    it("should prefer range over zone", () => {
      const data: FitTargetData = {
        customTargetPowerLow: 200,
        customTargetPowerHigh: 250,
        targetPowerZone: 4,
        targetValue: 1325,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should prefer zone over value", () => {
      const data: FitTargetData = {
        targetPowerZone: 4,
        targetValue: 1325,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 4 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when no power data is present", () => {
      const data: FitTargetData = {};

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });

    it("should return open when only low custom value is set (no high)", () => {
      const data: FitTargetData = {
        customTargetPowerLow: 200,
      };

      const result = convertPowerTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
