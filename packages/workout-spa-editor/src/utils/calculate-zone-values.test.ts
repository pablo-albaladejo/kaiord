/**
 * Zone Value Calculator Tests
 */

import { describe, expect, it } from "vitest";

import { findMethod, HR_METHODS, POWER_METHODS } from "../lib/zone-methods";
import {
  BRITISH_CYCLING_FTP_300_Z1_MAX,
  COGGAN_FTP_250_OUTPUTS,
  FRIEL_LTHR_170_Z1_MAX,
  FTP_ALT_WATTS,
  FTP_DEFAULT_WATTS,
  KARVONEN_LTHR_170_OUTPUTS,
  LTHR_DEFAULT_BPM,
  ZONE_INDEX_0,
  ZONE_INDEX_1,
  ZONE_INDEX_2,
  ZONE_LENGTH_5,
  ZONE_LENGTH_6,
  ZONE_LENGTH_7,
} from "../test-utils/zone-fixtures";
import { calculateHrZones } from "./calculate-hr-zones";
import { calculatePowerZoneValues } from "./calculate-power-zones";
import { calculateZoneValues } from "./calculate-zone-values";

describe("calculateZoneValues", () => {
  it("should calculate Coggan zones with FTP=250", () => {
    // Arrange
    const method = findMethod(POWER_METHODS, "coggan-7")!;

    // Act
    const zones = calculateZoneValues(method, FTP_DEFAULT_WATTS);

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_7);
    expect(zones[ZONE_INDEX_0]).toEqual({
      zone: 1,
      name: "Active Recovery",
      min: COGGAN_FTP_250_OUTPUTS.z1.min,
      max: COGGAN_FTP_250_OUTPUTS.z1.max,
    });
    expect(zones[ZONE_INDEX_1]).toEqual({
      zone: 2,
      name: "Endurance",
      min: COGGAN_FTP_250_OUTPUTS.z2.min,
      max: COGGAN_FTP_250_OUTPUTS.z2.max,
    });
    expect(zones[ZONE_INDEX_2]).toEqual({
      zone: 3,
      name: "Tempo",
      min: COGGAN_FTP_250_OUTPUTS.z3.min,
      max: COGGAN_FTP_250_OUTPUTS.z3.max,
    });
  });

  it("should calculate Karvonen HR zones with LTHR=170", () => {
    // Arrange
    const method = findMethod(HR_METHODS, "karvonen-5")!;

    // Act
    const zones = calculateZoneValues(method, LTHR_DEFAULT_BPM);

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_5);
    expect(zones[ZONE_INDEX_0]).toEqual({
      zone: 1,
      name: "Recovery",
      min: 0,
      max: KARVONEN_LTHR_170_OUTPUTS.z1Max,
    });
    expect(zones[ZONE_INDEX_1].min).toBe(KARVONEN_LTHR_170_OUTPUTS.z2Min);
  });
});

describe("calculatePowerZoneValues", () => {
  it("should return watt values for Coggan with FTP=250", () => {
    // Arrange

    // Act
    const zones = calculatePowerZoneValues(FTP_DEFAULT_WATTS, "coggan-7");

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_7);
    expect(zones[ZONE_INDEX_0].minWatts).toBe(COGGAN_FTP_250_OUTPUTS.z1.min);
    expect(zones[ZONE_INDEX_0].maxWatts).toBe(COGGAN_FTP_250_OUTPUTS.z1.max);
    expect(zones[ZONE_INDEX_1].minWatts).toBe(COGGAN_FTP_250_OUTPUTS.z2.min);
    expect(zones[ZONE_INDEX_2].name).toBe("Tempo");
    expect(zones[ZONE_INDEX_2].minWatts).toBe(COGGAN_FTP_250_OUTPUTS.z3.min);
    expect(zones[ZONE_INDEX_2].maxWatts).toBe(COGGAN_FTP_250_OUTPUTS.z3.max);
  });

  it("should return watt values for British Cycling 6-zone", () => {
    // Arrange

    // Act
    const zones = calculatePowerZoneValues(FTP_ALT_WATTS, "british-cycling-6");

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_6);
    expect(zones[ZONE_INDEX_0].name).toBe("Active Recovery");
    expect(zones[ZONE_INDEX_0].maxWatts).toBe(BRITISH_CYCLING_FTP_300_Z1_MAX);
  });

  it("should return watt values for Friel 7-zone", () => {
    // Arrange

    // Act
    const zones = calculatePowerZoneValues(FTP_DEFAULT_WATTS, "friel-7");

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_7);
    expect(zones[ZONE_INDEX_0].name).toBe("Active Recovery");
  });
});

describe("calculateHrZones", () => {
  it("should calculate Friel HR zones", () => {
    // Arrange

    // Act
    const zones = calculateHrZones(LTHR_DEFAULT_BPM, "friel-hr-5");

    // Assert
    expect(zones).toHaveLength(ZONE_LENGTH_5);
    expect(zones[ZONE_INDEX_0].name).toBe("Recovery");
    expect(zones[ZONE_INDEX_0].maxBpm).toBe(FRIEL_LTHR_170_Z1_MAX);
  });
});
