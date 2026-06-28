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
  });

  describe("method zoneCount", () => {
    it.each([
      { methods: POWER_METHODS, id: "coggan-7", count: COGGAN_ZONE_COUNT },
      { methods: POWER_METHODS, id: "friel-7", count: FRIEL_ZONE_COUNT },
      {
        methods: POWER_METHODS,
        id: "british-cycling-6",
        count: BRITISH_CYCLING_ZONE_COUNT,
      },
      { methods: POWER_METHODS, id: "custom", count: CUSTOM_POWER_ZONE_COUNT },
      { methods: HR_METHODS, id: "karvonen-5", count: KARVONEN_ZONE_COUNT },
      { methods: PACE_METHODS, id: "daniels-5", count: DANIELS_ZONE_COUNT },
    ])("should have $count zones for method $id", ({ methods, id, count }) => {
      // Arrange

      // Act
      const method = findMethod(methods, id);

      // Assert
      expect(method?.zoneCount).toBe(count);
      expect(method?.defaults).toHaveLength(count);
    });
  });

  describe("getDefaultMethodId", () => {
    it.each([
      { type: "power" as const, expected: "coggan-7" },
      { type: "hr" as const, expected: "karvonen-5" },
      { type: "pace" as const, expected: "daniels-5" },
    ])("should return $expected for $type", ({ type, expected }) => {
      // Arrange

      // Act
      const result = getDefaultMethodId(type);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("getMethodsForType", () => {
    it.each([
      { type: "power" as const, expected: POWER_METHODS },
      { type: "hr" as const, expected: HR_METHODS },
      { type: "pace" as const, expected: PACE_METHODS },
    ])("should return the registry for $type", ({ type, expected }) => {
      // Arrange

      // Act
      const result = getMethodsForType(type);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("percentage ranges", () => {
    it.each([
      { label: "power", methods: POWER_METHODS },
      { label: "HR", methods: HR_METHODS },
    ])(
      "should ensure all $label methods have non-negative percentages",
      ({ methods }) => {
        // Arrange

        // Act

        // Assert
        for (const method of methods) {
          for (const def of method.defaults) {
            expect(def.minPercent).toBeGreaterThanOrEqual(0);
            expect(def.maxPercent).toBeGreaterThan(0);
          }
        }
      }
    );
  });
});
