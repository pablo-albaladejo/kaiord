/**
 * Zone Methods Registry Tests
 */

import { describe, expect, it } from "vitest";

import {
  findMethod,
  getDefaultMethodId,
  getMethodsForType,
  HR_METHODS,
  PACE_METHODS,
  POWER_METHODS,
} from "./zone-methods";

const POWER_METHODS_COUNT = 6;
const COGGAN_ZONE_COUNT = 7;
const FRIEL_ZONE_COUNT = 7;
const BRITISH_CYCLING_ZONE_COUNT = 6;
const CUSTOM_POWER_ZONE_COUNT = 5;
const HR_METHODS_COUNT = 4;
const KARVONEN_ZONE_COUNT = 5;
const PACE_METHODS_COUNT = 2;
const DANIELS_ZONE_COUNT = 5;
const COGGAN_Z1_MAX_PERCENT = 55;
const KARVONEN_Z1_MAX_PERCENT = 82;

describe("zone method registries", () => {
  describe("POWER_METHODS", () => {
    it("should have 6 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(POWER_METHODS).toHaveLength(POWER_METHODS_COUNT);
    });

    it("should have 7 zones for Coggan 7-zone", () => {
      // Arrange

      // Act
      const coggan = findMethod(POWER_METHODS, "coggan-7");

      // Assert
      expect(coggan?.zoneCount).toBe(COGGAN_ZONE_COUNT);
      expect(coggan?.defaults).toHaveLength(COGGAN_ZONE_COUNT);
    });

    it("should have 7 zones for Friel 7-zone", () => {
      // Arrange

      // Act
      const friel = findMethod(POWER_METHODS, "friel-7");

      // Assert
      expect(friel?.zoneCount).toBe(FRIEL_ZONE_COUNT);
      expect(friel?.defaults).toHaveLength(FRIEL_ZONE_COUNT);
    });

    it("should have 6 zones for British Cycling", () => {
      // Arrange

      // Act
      const bc = findMethod(POWER_METHODS, "british-cycling-6");

      // Assert
      expect(bc?.zoneCount).toBe(BRITISH_CYCLING_ZONE_COUNT);
      expect(bc?.defaults).toHaveLength(BRITISH_CYCLING_ZONE_COUNT);
    });

    it("should have 5 default zones for Custom", () => {
      // Arrange

      // Act
      const custom = findMethod(POWER_METHODS, "custom");

      // Assert
      expect(custom?.zoneCount).toBe(CUSTOM_POWER_ZONE_COUNT);
      expect(custom?.defaults).toHaveLength(CUSTOM_POWER_ZONE_COUNT);
    });

    it("should set Coggan Z1 to 0-55%", () => {
      // Arrange

      // Act
      const coggan = findMethod(POWER_METHODS, "coggan-7")!;

      // Assert
      expect(coggan.defaults[0]).toEqual({
        name: "Active Recovery",
        minPercent: 0,
        maxPercent: COGGAN_Z1_MAX_PERCENT,
      });
    });
  });

  describe("HR_METHODS", () => {
    it("should have 4 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(HR_METHODS).toHaveLength(HR_METHODS_COUNT);
    });

    it("should have 5 zones for Karvonen 5-zone", () => {
      // Arrange

      // Act
      const karvonen = findMethod(HR_METHODS, "karvonen-5");

      // Assert
      expect(karvonen?.zoneCount).toBe(KARVONEN_ZONE_COUNT);
      expect(karvonen?.defaults).toHaveLength(KARVONEN_ZONE_COUNT);
    });

    it("should set Karvonen Z1 to 0-82%", () => {
      // Arrange

      // Act
      const karvonen = findMethod(HR_METHODS, "karvonen-5")!;

      // Assert
      expect(karvonen.defaults[0]).toEqual({
        name: "Recovery",
        minPercent: 0,
        maxPercent: KARVONEN_Z1_MAX_PERCENT,
      });
    });
  });

  describe("PACE_METHODS", () => {
    it("should have 2 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(PACE_METHODS).toHaveLength(PACE_METHODS_COUNT);
    });

    it("should have 5 zones for Daniels 5-zone", () => {
      // Arrange

      // Act
      const daniels = findMethod(PACE_METHODS, "daniels-5");

      // Assert
      expect(daniels?.zoneCount).toBe(DANIELS_ZONE_COUNT);
      expect(daniels?.defaults).toHaveLength(DANIELS_ZONE_COUNT);
    });
  });

  describe("getDefaultMethodId", () => {
    it("should return coggan-7 for power", () => {
      // Arrange

      // Act

      // Assert
      expect(getDefaultMethodId("power")).toBe("coggan-7");
    });

    it("should return karvonen-5 for hr", () => {
      // Arrange

      // Act

      // Assert
      expect(getDefaultMethodId("hr")).toBe("karvonen-5");
    });

    it("should return daniels-5 for pace", () => {
      // Arrange

      // Act

      // Assert
      expect(getDefaultMethodId("pace")).toBe("daniels-5");
    });
  });

  describe("getMethodsForType", () => {
    it("should return power methods", () => {
      // Arrange

      // Act

      // Assert
      expect(getMethodsForType("power")).toBe(POWER_METHODS);
    });

    it("should return hr methods", () => {
      // Arrange

      // Act

      // Assert
      expect(getMethodsForType("hr")).toBe(HR_METHODS);
    });

    it("should return pace methods", () => {
      // Arrange

      // Act

      // Assert
      expect(getMethodsForType("pace")).toBe(PACE_METHODS);
    });
  });

  describe("percentage ranges", () => {
    it("should ensure all power methods have non-negative percentages", () => {
      // Arrange

      // Act

      // Assert
      for (const method of POWER_METHODS) {
        for (const def of method.defaults) {
          expect(def.minPercent).toBeGreaterThanOrEqual(0);
          expect(def.maxPercent).toBeGreaterThan(0);
        }
      }
    });

    it("should ensure all HR methods have non-negative percentages", () => {
      // Arrange

      // Act

      // Assert
      for (const method of HR_METHODS) {
        for (const def of method.defaults) {
          expect(def.minPercent).toBeGreaterThanOrEqual(0);
          expect(def.maxPercent).toBeGreaterThan(0);
        }
      }
    });
  });
});
