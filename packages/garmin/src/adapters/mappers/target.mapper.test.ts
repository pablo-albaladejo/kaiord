import { describe, expect, it } from "vitest";
import { mapKrdTargetToGarmin } from "./target.mapper";
import type { Target } from "@kaiord/core";
import type { PaceZoneTable } from "./target.mapper";

describe("mapKrdTargetToGarmin", () => {
  describe("pace zone resolution", () => {
    const paceZones: PaceZoneTable = [
      { zone: 1, minMps: 2.54, maxMps: 2.86 },
      { zone: 2, minMps: 2.86, maxMps: 3.08 },
      { zone: 3, minMps: 3.08, maxMps: 3.51 },
      { zone: 4, minMps: 3.51, maxMps: 4.0 },
      { zone: 5, minMps: 4.02, maxMps: 4.76 },
    ];

    it("should resolve pace zone to m/s range when table provided", () => {
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 3 },
      };

      const result = mapKrdTargetToGarmin(target, { paceZones });

      expect(result.zoneNumber).toBeNull();
      expect(result.targetValueOne).toBe(3.08);
      expect(result.targetValueTwo).toBe(3.51);
      expect(result.targetType.workoutTargetTypeKey).toBe("pace.zone");
    });

    it("should throw when pace zone used without table", () => {
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 3 },
      };

      expect(() => mapKrdTargetToGarmin(target)).toThrow(
        /pace zone .* require/i
      );
    });

    it("should throw for unknown zone number", () => {
      const target: Target = {
        type: "pace",
        value: { unit: "zone", value: 9 },
      };

      expect(() => mapKrdTargetToGarmin(target, { paceZones })).toThrow(
        /zone 9/i
      );
    });

    it("should pass pace range through unchanged", () => {
      const target: Target = {
        type: "pace",
        value: { unit: "range", min: 3.5, max: 4.0 },
      };

      const result = mapKrdTargetToGarmin(target);

      expect(result.targetValueOne).toBe(3.5);
      expect(result.targetValueTwo).toBe(4.0);
      expect(result.zoneNumber).toBeNull();
    });
  });

  describe("power zone passthrough", () => {
    it("should still use zoneNumber for power zones", () => {
      const target: Target = {
        type: "power",
        value: { unit: "zone", value: 3 },
      };

      const result = mapKrdTargetToGarmin(target);

      expect(result.zoneNumber).toBe(3);
      expect(result.targetValueOne).toBeNull();
      expect(result.targetValueTwo).toBeNull();
    });
  });

  describe("heart rate zone passthrough", () => {
    it("should still use zoneNumber for HR zones", () => {
      const target: Target = {
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      };

      const result = mapKrdTargetToGarmin(target);

      expect(result.zoneNumber).toBe(4);
      expect(result.targetValueOne).toBeNull();
      expect(result.targetValueTwo).toBeNull();
    });
  });
});
