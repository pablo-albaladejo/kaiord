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

describe("zone method registries", () => {
  describe("POWER_METHODS", () => {
    it("should have 6 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(POWER_METHODS).toHaveLength(6);
    });

    it("should have 7 zones for Coggan 7-zone", () => {
      // Arrange

      // Act
      const coggan = findMethod(POWER_METHODS, "coggan-7");

      // Assert
      expect(coggan?.zoneCount).toBe(7);
      expect(coggan?.defaults).toHaveLength(7);
    });

    it("should have 7 zones for Friel 7-zone", () => {
      // Arrange

      // Act
      const friel = findMethod(POWER_METHODS, "friel-7");

      // Assert
      expect(friel?.zoneCount).toBe(7);
      expect(friel?.defaults).toHaveLength(7);
    });

    it("should have 6 zones for British Cycling", () => {
      // Arrange

      // Act
      const bc = findMethod(POWER_METHODS, "british-cycling-6");

      // Assert
      expect(bc?.zoneCount).toBe(6);
      expect(bc?.defaults).toHaveLength(6);
    });

    it("should have 5 default zones for Custom", () => {
      // Arrange

      // Act
      const custom = findMethod(POWER_METHODS, "custom");

      // Assert
      expect(custom?.zoneCount).toBe(5);
      expect(custom?.defaults).toHaveLength(5);
    });

    it("should set Coggan Z1 to 0-55%", () => {
      // Arrange

      // Act
      const coggan = findMethod(POWER_METHODS, "coggan-7")!;

      // Assert
      expect(coggan.defaults[0]).toEqual({
        name: "Active Recovery",
        minPercent: 0,
        maxPercent: 55,
      });
    });
  });

  describe("HR_METHODS", () => {
    it("should have 4 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(HR_METHODS).toHaveLength(4);
    });

    it("should have 5 zones for Karvonen 5-zone", () => {
      // Arrange

      // Act
      const karvonen = findMethod(HR_METHODS, "karvonen-5");

      // Assert
      expect(karvonen?.zoneCount).toBe(5);
      expect(karvonen?.defaults).toHaveLength(5);
    });

    it("should set Karvonen Z1 to 0-82%", () => {
      // Arrange

      // Act
      const karvonen = findMethod(HR_METHODS, "karvonen-5")!;

      // Assert
      expect(karvonen.defaults[0]).toEqual({
        name: "Recovery",
        minPercent: 0,
        maxPercent: 82,
      });
    });
  });

  describe("PACE_METHODS", () => {
    it("should have 2 methods", () => {
      // Arrange

      // Act

      // Assert
      expect(PACE_METHODS).toHaveLength(2);
    });

    it("should have 5 zones for Daniels 5-zone", () => {
      // Arrange

      // Act
      const daniels = findMethod(PACE_METHODS, "daniels-5");

      // Assert
      expect(daniels?.zoneCount).toBe(5);
      expect(daniels?.defaults).toHaveLength(5);
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
