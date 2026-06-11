import type { Target } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { PACE_M_PER_S, POWER_W, ZONE } from "../../test-utils/constants";
import { convertKrdTargetToGarmin } from "./target-to-garmin.converter";
import type { PaceZoneTable } from "./target-types";

describe("convertKrdTargetToGarmin", () => {
  describe("pace zone resolution", () => {
    const paceZones: PaceZoneTable = [
      { zone: 1, minMps: 2.54, maxMps: 2.86 },
      { zone: 2, minMps: 2.86, maxMps: 3.08 },
      { zone: 3, minMps: 3.08, maxMps: 3.51 },
      { zone: 4, minMps: 3.51, maxMps: 4.0 },
      { zone: 5, minMps: 4.0, maxMps: 4.76 },
    ];

    it("should resolve pace zone to m/s range with faster m/s in targetValueOne", () => {
      // Arrange
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 3 },
      };

      // Act
      const result = convertKrdTargetToGarmin(target, { paceZones });

      // Assert
      // Garmin stores pace ranges as (faster_m_s, slower_m_s) — see adapter-contracts spec.
      expect(result.zoneNumber).toBeNull();
      expect(result.targetValueOne).toBe(PACE_M_PER_S.Z3_MAX);
      expect(result.targetValueTwo).toBe(PACE_M_PER_S.Z3_MIN);
      expect(result.targetType.workoutTargetTypeKey).toBe("pace.zone");
    });

    it("should throw when pace zone used without table", () => {
      // Arrange

      // Act
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 3 },
      };

      // Assert
      expect(() => convertKrdTargetToGarmin(target)).toThrow(
        /pace zone .* require/i
      );
    });

    it("should throw for unknown zone number", () => {
      // Arrange

      // Act
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 9 },
      };

      // Assert
      expect(() => convertKrdTargetToGarmin(target, { paceZones })).toThrow(
        /zone 9/i
      );
    });

    it("should encode pace range with faster m/s in targetValueOne", () => {
      // Arrange
      const target: Target = {
        type: "pace",
        value: { unit: "range", min: 3.5, max: 4.0 },
      };

      // Act
      const result = convertKrdTargetToGarmin(target);

      // Assert
      // Faster pace = higher m/s -> targetValueOne; slower = lower m/s -> targetValueTwo.
      expect(result.targetValueOne).toBe(PACE_M_PER_S.RANGE_HIGH);
      expect(result.targetValueTwo).toBe(PACE_M_PER_S.RANGE_LOW);
      expect(result.zoneNumber).toBeNull();
    });

    it("should encode power range with higher wattage in targetValueOne", () => {
      // Arrange
      const target: Target = {
        type: "power",
        value: {
          unit: "range",
          min: POWER_W.RANGE_LOW,
          max: POWER_W.RANGE_HIGH,
        },
      };

      // Act
      const result = convertKrdTargetToGarmin(target);

      // Assert
      // Higher wattage = higher intensity -> targetValueOne.
      expect(result.targetValueOne).toBe(POWER_W.RANGE_HIGH);
      expect(result.targetValueTwo).toBe(POWER_W.RANGE_LOW);
      expect(result.zoneNumber).toBeNull();
      expect(result.targetType.workoutTargetTypeKey).toBe("power.zone");
    });
  });

  describe("power zone passthrough", () => {
    it("should still use zoneNumber for power zones", () => {
      // Arrange
      const target: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      // Act
      const result = convertKrdTargetToGarmin(target);

      // Assert
      expect(result.zoneNumber).toBe(ZONE.Z3);
      expect(result.targetValueOne).toBeNull();
      expect(result.targetValueTwo).toBeNull();
    });
  });

  describe("heart rate zone passthrough", () => {
    it("should still use zoneNumber for HR zones", () => {
      // Arrange
      const target: Target = {
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      };

      // Act
      const result = convertKrdTargetToGarmin(target);

      // Assert
      expect(result.zoneNumber).toBe(ZONE.Z4);
      expect(result.targetValueOne).toBeNull();
      expect(result.targetValueTwo).toBeNull();
    });
  });
});
