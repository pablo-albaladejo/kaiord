/**
 * Zone Methods Registry Tests
 */

import { describe, expect, it } from "vitest";
import {
  POWER_METHODS,
  HR_METHODS,
  PACE_METHODS,
  findMethod,
  getDefaultMethodId,
  getMethodsForType,
} from "./zone-methods";

describe("zone method registries", () => {
  describe("POWER_METHODS", () => {
    it("should have 4 methods", () => {
      expect(POWER_METHODS).toHaveLength(4);
    });

    it("Coggan 7-zone should have 7 zones", () => {
      const coggan = findMethod(POWER_METHODS, "coggan-7");
      expect(coggan?.zoneCount).toBe(7);
      expect(coggan?.defaults).toHaveLength(7);
    });

    it("Friel 7-zone should have 7 zones", () => {
      const friel = findMethod(POWER_METHODS, "friel-7");
      expect(friel?.zoneCount).toBe(7);
      expect(friel?.defaults).toHaveLength(7);
    });

    it("British Cycling should have 6 zones", () => {
      const bc = findMethod(POWER_METHODS, "british-cycling-6");
      expect(bc?.zoneCount).toBe(6);
      expect(bc?.defaults).toHaveLength(6);
    });

    it("Custom should have 5 default zones", () => {
      const custom = findMethod(POWER_METHODS, "custom");
      expect(custom?.zoneCount).toBe(5);
      expect(custom?.defaults).toHaveLength(5);
    });

    it("Coggan Z1 should be 0-55%", () => {
      const coggan = findMethod(POWER_METHODS, "coggan-7")!;
      expect(coggan.defaults[0]).toEqual({
        name: "Active Recovery",
        minPercent: 0,
        maxPercent: 55,
      });
    });
  });

  describe("HR_METHODS", () => {
    it("should have 3 methods", () => {
      expect(HR_METHODS).toHaveLength(3);
    });

    it("Karvonen 5-zone should have 5 zones", () => {
      const karvonen = findMethod(HR_METHODS, "karvonen-5");
      expect(karvonen?.zoneCount).toBe(5);
      expect(karvonen?.defaults).toHaveLength(5);
    });

    it("Karvonen Z1 should be 0-82%", () => {
      const karvonen = findMethod(HR_METHODS, "karvonen-5")!;
      expect(karvonen.defaults[0]).toEqual({
        name: "Recovery",
        minPercent: 0,
        maxPercent: 82,
      });
    });
  });

  describe("PACE_METHODS", () => {
    it("should have 2 methods", () => {
      expect(PACE_METHODS).toHaveLength(2);
    });

    it("Daniels 5-zone should have 5 zones", () => {
      const daniels = findMethod(PACE_METHODS, "daniels-5");
      expect(daniels?.zoneCount).toBe(5);
      expect(daniels?.defaults).toHaveLength(5);
    });
  });

  describe("getDefaultMethodId", () => {
    it("should return coggan-7 for power", () => {
      expect(getDefaultMethodId("power")).toBe("coggan-7");
    });

    it("should return karvonen-5 for hr", () => {
      expect(getDefaultMethodId("hr")).toBe("karvonen-5");
    });

    it("should return daniels-5 for pace", () => {
      expect(getDefaultMethodId("pace")).toBe("daniels-5");
    });
  });

  describe("getMethodsForType", () => {
    it("should return power methods", () => {
      expect(getMethodsForType("power")).toBe(POWER_METHODS);
    });

    it("should return hr methods", () => {
      expect(getMethodsForType("hr")).toBe(HR_METHODS);
    });

    it("should return pace methods", () => {
      expect(getMethodsForType("pace")).toBe(PACE_METHODS);
    });
  });

  describe("percentage ranges", () => {
    it("all power methods should have non-negative percentages", () => {
      for (const method of POWER_METHODS) {
        for (const def of method.defaults) {
          expect(def.minPercent).toBeGreaterThanOrEqual(0);
          expect(def.maxPercent).toBeGreaterThan(0);
        }
      }
    });

    it("all HR methods should have non-negative percentages", () => {
      for (const method of HR_METHODS) {
        for (const def of method.defaults) {
          expect(def.minPercent).toBeGreaterThanOrEqual(0);
          expect(def.maxPercent).toBeGreaterThan(0);
        }
      }
    });
  });
});
