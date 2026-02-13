import { describe, expect, it } from "vitest";
import { convertCadenceTargetToTcx } from "./cadence.converter";

describe("convertCadenceTargetToTcx", () => {
  describe("range unit", () => {
    it("should convert range for cycling without doubling", () => {
      const value = { unit: "range", min: 80, max: 100 };

      const result = convertCadenceTargetToTcx(value, "cycling");

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 80,
          High: 100,
        },
      });
    });

    it("should convert range for running with RPM to SPM doubling", () => {
      const value = { unit: "range", min: 80, max: 90 };

      const result = convertCadenceTargetToTcx(value, "running");

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 160,
          High: 180,
        },
      });
    });

    it("should convert range for Running with capital R", () => {
      const value = { unit: "range", min: 85, max: 95 };

      const result = convertCadenceTargetToTcx(value, "Running");

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 170,
          High: 190,
        },
      });
    });

    it("should not double when sport is undefined (non-running)", () => {
      const value = { unit: "range", min: 80, max: 100 };

      const result = convertCadenceTargetToTcx(value);

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 80,
          High: 100,
        },
      });
    });

    it("should return None_t when range min is undefined", () => {
      const value = { unit: "range", max: 100 };

      const result = convertCadenceTargetToTcx(value);

      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });

    it("should return None_t when range max is undefined", () => {
      const value = { unit: "range", min: 80 };

      const result = convertCadenceTargetToTcx(value);

      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });
  });

  describe("rpm unit", () => {
    it("should convert rpm for cycling with same low and high", () => {
      const value = { unit: "rpm", value: 90 };

      const result = convertCadenceTargetToTcx(value, "cycling");

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 90,
          High: 90,
        },
      });
    });

    it("should convert rpm for running with doubling", () => {
      const value = { unit: "rpm", value: 90 };

      const result = convertCadenceTargetToTcx(value, "running");

      expect(result).toStrictEqual({
        "@_xsi:type": "Cadence_t",
        CadenceZone: {
          "@_xsi:type": "CustomCadenceZone_t",
          Low: 180,
          High: 180,
        },
      });
    });

    it("should return None_t when rpm value is undefined", () => {
      const value = { unit: "rpm" };

      const result = convertCadenceTargetToTcx(value);

      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });
  });

  describe("unsupported units", () => {
    it("should return None_t for unknown unit", () => {
      const value = { unit: "unknown", value: 90 };

      const result = convertCadenceTargetToTcx(value);

      expect(result).toStrictEqual({ "@_xsi:type": "None_t" });
    });
  });
});
