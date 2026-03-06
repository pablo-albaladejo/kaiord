/**
 * parse-zone-field utility tests
 */

import { describe, expect, it } from "vitest";
import { applyValueChange } from "./parse-zone-field";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

const hrZones: Array<HeartRateZone> = [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
];

const powerZones: Array<PowerZone> = [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
];

const paceZones: Array<PaceZone> = [
  { zone: 1, name: "Z1", minPace: 360, maxPace: 420, unit: "min_per_km" },
];

describe("applyValueChange", () => {
  it("should update HR min value", () => {
    const result = applyValueChange(hrZones, 0, "min", "110", "heartRate");

    expect((result![0] as HeartRateZone).minBpm).toBe(110);
  });

  it("should update HR max value", () => {
    const result = applyValueChange(hrZones, 1, "max", "170", "heartRate");

    expect((result![1] as HeartRateZone).maxBpm).toBe(170);
  });

  it("should return null for invalid HR input", () => {
    const result = applyValueChange(hrZones, 0, "min", "abc", "heartRate");

    expect(result).toBeNull();
  });

  it("should update power percent directly", () => {
    const result = applyValueChange(powerZones, 0, "max", "60%", "power");

    expect((result![0] as PowerZone).maxPercent).toBe(60);
  });

  it("should convert watts to percent with threshold", () => {
    const result = applyValueChange(powerZones, 0, "max", "150W", "power", 300);

    expect((result![0] as PowerZone).maxPercent).toBe(50);
  });

  it("should update pace from mm:ss format", () => {
    const result = applyValueChange(paceZones, 0, "min", "5:30", "pace");

    expect((result![0] as PaceZone).minPace).toBe(330);
  });

  it("should return null for invalid pace format", () => {
    const result = applyValueChange(paceZones, 0, "min", "invalid", "pace");

    expect(result).toBeNull();
  });
});
