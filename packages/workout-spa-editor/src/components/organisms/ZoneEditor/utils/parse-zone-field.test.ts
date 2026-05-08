import { describe, expect, it } from "vitest";

import {
  EXPECTED_CASCADE_HR_180_TRIO,
  EXPECTED_CASCADE_NEXT_BPM_141,
  EXPECTED_CASCADE_PACE_NEXT_SEC_451,
  EXPECTED_CASCADE_PREV_BPM_124,
  EXPECTED_PERCENT_50,
  EXPECTED_PERCENT_80,
  EXPECTED_PERCENT_114,
  FTP_ALT_WATTS,
  FTP_DEFAULT_WATTS,
  HR_INPUT_BPM_90,
  HR_INPUT_BPM_110,
  HR_INPUT_BPM_140,
  HR_INPUT_BPM_170,
  HR_INPUT_BPM_180,
  HR_INPUT_BPM_200,
  HR_ZONES_3 as hrZones,
  MM_SS_INPUT_5_30_SEC,
  MM_SS_INPUT_7_30_SEC,
  PACE_ZONES_2 as paceZones,
  POWER_ZONES_3 as powerZones,
  ZONE_INDEX_0,
  ZONE_INDEX_1,
  ZONE_INDEX_2,
  ZONE_LENGTH_3,
} from "../../../../test-utils/zone-fixtures";
import type { HeartRateZone, PowerZone } from "../../../../types/profile";
import type { PaceZone } from "../../../../types/sport-zones";

const HR_BPM_125 = 125;
const POWER_WATTS_201 = 201;
const HR_ZONE2_MIN_BPM_131 = 131;
const HR_ZONE2_MAX_BPM_160 = 160;
const HR_ZONE3_MIN_BPM_161 = 161;
const HR_ZONE3_MAX_BPM_190 = 190;
const HR_ZONE1_MAX_BPM_130 = 130;
import { applyValueChange } from "./parse-zone-field";

describe("applyValueChange", () => {
  it("should update HR min value", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_0,
      "min",
      "110",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_0] as HeartRateZone).minBpm).toBe(
      HR_INPUT_BPM_110
    );
  });

  it("should update HR max value", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_1,
      "max",
      "170",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_1] as HeartRateZone).maxBpm).toBe(
      HR_INPUT_BPM_170
    );
  });

  it("should return null for invalid HR input", () => {
    // Arrange

    // Act

    // Assert
    expect(
      applyValueChange(hrZones, ZONE_INDEX_0, "min", "abc", "heartRate")
    ).toBeNull();
  });

  it("should convert watts to percent with threshold", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      powerZones,
      ZONE_INDEX_0,
      "max",
      "150",
      "power",
      FTP_ALT_WATTS
    );

    // Assert

    expect((result![ZONE_INDEX_0] as PowerZone).maxPercent).toBe(
      EXPECTED_PERCENT_50
    );
  });

  it("should convert bare number to percent when threshold exists", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      powerZones,
      ZONE_INDEX_0,
      "max",
      "200",
      "power",
      FTP_DEFAULT_WATTS
    );

    // Assert

    expect(Math.round((result![ZONE_INDEX_0] as PowerZone).maxPercent)).toBe(
      EXPECTED_PERCENT_80
    );
  });

  it("should treat bare number as percent when no threshold", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      powerZones,
      ZONE_INDEX_0,
      "max",
      "80",
      "power"
    );

    // Assert

    expect(Math.round((result![ZONE_INDEX_0] as PowerZone).maxPercent)).toBe(
      EXPECTED_PERCENT_80
    );
  });

  it("should update pace from mm:ss format", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      paceZones,
      ZONE_INDEX_0,
      "min",
      "5:30",
      "pace"
    );

    // Assert

    expect((result![ZONE_INDEX_0] as PaceZone).minPace).toBe(
      MM_SS_INPUT_5_30_SEC
    );
  });

  it("should return null for invalid pace format", () => {
    // Arrange

    // Act

    // Assert
    expect(
      applyValueChange(paceZones, ZONE_INDEX_0, "min", "invalid", "pace")
    ).toBeNull();
  });

  // Cascade tests
  it("should cascade max change to next zone min (HR)", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_0,
      "max",
      "140",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_0] as HeartRateZone).maxBpm).toBe(
      HR_INPUT_BPM_140
    );
    expect((result![ZONE_INDEX_1] as HeartRateZone).minBpm).toBe(
      EXPECTED_CASCADE_NEXT_BPM_141
    );
  });

  it("should cascade min change to previous zone max (HR)", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_1,
      "min",
      "125",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_1] as HeartRateZone).minBpm).toBe(HR_BPM_125);
    expect((result![ZONE_INDEX_0] as HeartRateZone).maxBpm).toBe(
      EXPECTED_CASCADE_PREV_BPM_124
    );
  });

  it("should cascade max change to next zone min (power with threshold)", () => {
    // Arrange

    const result = applyValueChange(
      powerZones,
      ZONE_INDEX_0,
      "max",
      "200",
      "power",
      FTP_DEFAULT_WATTS
    );
    // 200W → 80%, next zone min should be 201W → 80% (rounded)
    const z1 = result![ZONE_INDEX_0] as PowerZone;

    // Act

    const z2 = result![ZONE_INDEX_1] as PowerZone;

    // Assert

    expect(Math.round(z1.maxPercent)).toBe(EXPECTED_PERCENT_80);
    const z2MinW = Math.round((FTP_DEFAULT_WATTS * z2.minPercent) / 100);
    expect(z2MinW).toBe(POWER_WATTS_201);
  });

  it("should not cascade beyond first zone", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_0,
      "min",
      "90",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_0] as HeartRateZone).minBpm).toBe(
      HR_INPUT_BPM_90
    );
    // Untouched zones remain the same
    expect((result![ZONE_INDEX_1] as HeartRateZone).minBpm).toBe(
      HR_ZONE2_MIN_BPM_131
    );
    expect((result![ZONE_INDEX_1] as HeartRateZone).maxBpm).toBe(
      HR_ZONE2_MAX_BPM_160
    );
    expect((result![ZONE_INDEX_2] as HeartRateZone).minBpm).toBe(
      HR_ZONE3_MIN_BPM_161
    );
    expect((result![ZONE_INDEX_2] as HeartRateZone).maxBpm).toBe(
      HR_ZONE3_MAX_BPM_190
    );
    expect(result!.length).toBe(ZONE_LENGTH_3);
  });

  it("should not cascade beyond last zone", () => {
    // Arrange

    // Act

    const result = applyValueChange(
      hrZones,
      ZONE_INDEX_2,
      "max",
      "200",
      "heartRate"
    );

    // Assert

    expect((result![ZONE_INDEX_2] as HeartRateZone).maxBpm).toBe(
      HR_INPUT_BPM_200
    );
    // Untouched zones remain the same
    expect((result![ZONE_INDEX_0] as HeartRateZone).minBpm).toBe(100);
    expect((result![ZONE_INDEX_0] as HeartRateZone).maxBpm).toBe(
      HR_ZONE1_MAX_BPM_130
    );
    expect((result![ZONE_INDEX_1] as HeartRateZone).minBpm).toBe(
      HR_ZONE2_MIN_BPM_131
    );
    expect((result![ZONE_INDEX_1] as HeartRateZone).maxBpm).toBe(
      HR_ZONE2_MAX_BPM_160
    );
    expect(result!.length).toBe(ZONE_LENGTH_3);
  });

  it("should cascade pace max to next zone min", () => {
    // Cascade treats pace like ascending zones (minPace->maxPace).
    // Increasing Z1 maxPace pushes Z2 minPace forward.
    // Arrange

    // Act

    const result = applyValueChange(
      paceZones,
      ZONE_INDEX_0,
      "max",
      "7:30",
      "pace"
    );

    // Assert

    expect((result![ZONE_INDEX_0] as PaceZone).maxPace).toBe(
      MM_SS_INPUT_7_30_SEC
    );
    expect((result![ZONE_INDEX_1] as PaceZone).minPace).toBe(
      EXPECTED_CASCADE_PACE_NEXT_SEC_451
    );
    // Z2 max pushed since 451 > 359
    expect((result![ZONE_INDEX_1] as PaceZone).maxPace).toBeGreaterThanOrEqual(
      EXPECTED_CASCADE_PACE_NEXT_SEC_451
    );
  });
});

it("should cascade recursively when max pushes through next zone", () => {
  // Z1: 100-130, Z2: 131-160, Z3: 161-190
  // Set Z1 max to 180 → Z2 min=181, Z2 max (160) < 181 → push Z2 max to 182
  // → Z3 min=183
  // Arrange

  const result = applyValueChange(
    hrZones,
    ZONE_INDEX_0,
    "max",
    "180",
    "heartRate"
  );

  const z1 = result![ZONE_INDEX_0] as HeartRateZone;
  const z2 = result![ZONE_INDEX_1] as HeartRateZone;

  // Act

  const z3 = result![ZONE_INDEX_2] as HeartRateZone;

  // Assert

  expect(z1.maxBpm).toBe(HR_INPUT_BPM_180);
  expect(z2.minBpm).toBe(EXPECTED_CASCADE_HR_180_TRIO.z2Min);
  expect(z2.maxBpm).toBe(EXPECTED_CASCADE_HR_180_TRIO.z2Max);
  expect(z3.minBpm).toBe(EXPECTED_CASCADE_HR_180_TRIO.z3Min);
  expect(z3.maxBpm).toBe(HR_ZONE3_MAX_BPM_190);
});

it("should fix same zone when min exceeds max and cascade forward", () => {
  // Power: Z1: 0-55%, Z2: 56-75%, Z3: 76-90%  (FTP=250)
  // Z1=0-137W, Z2=140-187W, Z3=190-225W
  // Set Z3 min to 285W (114%) → Z3 max (225W) < 285W
  // → Z3 max pushed to 286W, Z4+ would cascade
  // Arrange

  const zones = powerZones;
  const result = applyValueChange(
    zones,
    ZONE_INDEX_2,
    "min",
    "285",
    "power",
    FTP_DEFAULT_WATTS
  );

  const z2 = result![ZONE_INDEX_1] as PowerZone;

  // Act

  const z3 = result![ZONE_INDEX_2] as PowerZone;
  // Z3 min = 285W → 114%

  // Assert

  expect(Math.round(z3.minPercent)).toBe(EXPECTED_PERCENT_114);
  // Z3 max must be >= Z3 min
  const z3MaxW = Math.round((FTP_DEFAULT_WATTS * z3.maxPercent) / 100);
  const z3MinW = Math.round((FTP_DEFAULT_WATTS * z3.minPercent) / 100);
  expect(z3MaxW).toBeGreaterThanOrEqual(z3MinW);
  // Z2 max should be 284W (Z3 min - 1)
  const z2MaxW = Math.round((FTP_DEFAULT_WATTS * z2.maxPercent) / 100);
  expect(z2MaxW).toBeLessThanOrEqual(z3MinW);
});
