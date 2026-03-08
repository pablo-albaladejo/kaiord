import { describe, expect, it } from "vitest";
import { applyValueChange } from "./parse-zone-field";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

const hrZones: Array<HeartRateZone> = [
  { zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 },
  { zone: 2, name: "Z2", minBpm: 131, maxBpm: 160 },
  { zone: 3, name: "Z3", minBpm: 161, maxBpm: 190 },
];

const powerZones: Array<PowerZone> = [
  { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
];

const paceZones: Array<PaceZone> = [
  { zone: 1, name: "Z1", minPace: 360, maxPace: 420, unit: "min_per_km" },
  { zone: 2, name: "Z2", minPace: 300, maxPace: 359, unit: "min_per_km" },
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
    expect(applyValueChange(hrZones, 0, "min", "abc", "heartRate")).toBeNull();
  });

  it("should convert watts to percent with threshold", () => {
    const result = applyValueChange(powerZones, 0, "max", "150", "power", 300);
    expect((result![0] as PowerZone).maxPercent).toBe(50);
  });

  it("should convert bare number to percent when threshold exists", () => {
    const result = applyValueChange(powerZones, 0, "max", "200", "power", 250);
    expect(Math.round((result![0] as PowerZone).maxPercent)).toBe(80);
  });

  it("should treat bare number as percent when no threshold", () => {
    const result = applyValueChange(powerZones, 0, "max", "80", "power");
    expect(Math.round((result![0] as PowerZone).maxPercent)).toBe(80);
  });

  it("should update pace from mm:ss format", () => {
    const result = applyValueChange(paceZones, 0, "min", "5:30", "pace");
    expect((result![0] as PaceZone).minPace).toBe(330);
  });

  it("should return null for invalid pace format", () => {
    expect(applyValueChange(paceZones, 0, "min", "invalid", "pace")).toBeNull();
  });

  // Cascade tests
  it("should cascade max change to next zone min (HR)", () => {
    const result = applyValueChange(hrZones, 0, "max", "140", "heartRate");
    expect((result![0] as HeartRateZone).maxBpm).toBe(140);
    expect((result![1] as HeartRateZone).minBpm).toBe(141);
  });

  it("should cascade min change to previous zone max (HR)", () => {
    const result = applyValueChange(hrZones, 1, "min", "125", "heartRate");
    expect((result![1] as HeartRateZone).minBpm).toBe(125);
    expect((result![0] as HeartRateZone).maxBpm).toBe(124);
  });

  it("should cascade max change to next zone min (power with threshold)", () => {
    const result = applyValueChange(powerZones, 0, "max", "200", "power", 250);
    // 200W → 80%, next zone min should be 201W → 80% (rounded)
    const z1 = result![0] as PowerZone;
    const z2 = result![1] as PowerZone;
    expect(Math.round(z1.maxPercent)).toBe(80);
    const z2MinW = Math.round((250 * z2.minPercent) / 100);
    expect(z2MinW).toBe(201);
  });

  it("should not cascade beyond first zone", () => {
    const result = applyValueChange(hrZones, 0, "min", "90", "heartRate");
    expect((result![0] as HeartRateZone).minBpm).toBe(90);
    // No zone before index 0, so no cascade
    expect(result!.length).toBe(3);
  });

  it("should not cascade beyond last zone", () => {
    const result = applyValueChange(hrZones, 2, "max", "200", "heartRate");
    expect((result![2] as HeartRateZone).maxBpm).toBe(200);
    // No zone after last, so no cascade
    expect(result!.length).toBe(3);
  });

  it("should cascade pace max to next zone min", () => {
    const result = applyValueChange(paceZones, 0, "max", "7:30", "pace");
    expect((result![0] as PaceZone).maxPace).toBe(450);
    expect((result![1] as PaceZone).minPace).toBe(451);
  });
});

it("should cascade recursively when max pushes through next zone", () => {
  // Z1: 100-130, Z2: 131-160, Z3: 161-190
  // Set Z1 max to 180 → Z2 min=181, Z2 max must be >= 181 → push Z2 max to 182
  // → Z3 min=183
  const result = applyValueChange(hrZones, 0, "max", "180", "heartRate");

  const z1 = result![0] as HeartRateZone;
  const z2 = result![1] as HeartRateZone;
  const z3 = result![2] as HeartRateZone;

  expect(z1.maxBpm).toBe(180);
  expect(z2.minBpm).toBe(181);
  expect(z2.maxBpm).toBeGreaterThanOrEqual(z2.minBpm);
  expect(z3.minBpm).toBe(z2.maxBpm + 1);
});

it("should fix same zone when min exceeds max and cascade forward", () => {
  // Power: Z1: 0-55%, Z2: 56-75%, Z3: 76-90%  (FTP=250)
  // Z1=0-137W, Z2=140-187W, Z3=190-225W
  // Set Z3 min to 285W (114%) → Z3 max (225W) < 285W
  // → Z3 max pushed to 286W, Z4+ would cascade
  const zones: Array<PowerZone> = [
    { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
    { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
    { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
  ];
  const result = applyValueChange(zones, 2, "min", "285", "power", 250);

  const z2 = result![1] as PowerZone;
  const z3 = result![2] as PowerZone;
  // Z3 min = 285W → 114%
  expect(Math.round(z3.minPercent)).toBe(114);
  // Z3 max must be >= Z3 min
  const z3MaxW = Math.round((250 * z3.maxPercent) / 100);
  const z3MinW = Math.round((250 * z3.minPercent) / 100);
  expect(z3MaxW).toBeGreaterThanOrEqual(z3MinW);
  // Z2 max should be 284W (Z3 min - 1)
  const z2MaxW = Math.round((250 * z2.maxPercent) / 100);
  expect(z2MaxW).toBeLessThanOrEqual(z3MinW);
});
