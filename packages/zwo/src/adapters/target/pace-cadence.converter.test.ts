import { describe, expect, it } from "vitest";

import {
  CADENCE_RPM,
  CADENCE_SPM,
  PACE_METERS,
  PACE_SECONDS_PER_KM,
  SPEED_MPS,
} from "../../test-utils";
import {
  convertKrdCadenceToZwift,
  convertKrdPaceToZwift,
  convertZwiftCadenceTarget,
  convertZwiftPaceTarget,
} from "./pace-cadence.converter";

describe("convertZwiftPaceTarget", () => {
  it("should convert seconds per km to meters per second", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(PACE_SECONDS_PER_KM.MODERATE);

    // Assert
    expect(result).toStrictEqual({
      type: "pace",
      value: {
        unit: "mps",
        value: PACE_METERS.KILOMETER / PACE_SECONDS_PER_KM.MODERATE,
      },
    });
  });

  it.each([
    { secPerKm: PACE_SECONDS_PER_KM.FAST, mps: SPEED_MPS.PACE_4_167 },
    { secPerKm: PACE_SECONDS_PER_KM.SLOW, mps: SPEED_MPS.PACE_2_778 },
    { secPerKm: PACE_SECONDS_PER_KM.VERY_FAST, mps: SPEED_MPS.PACE_5_556 },
  ])(
    "should convert $secPerKm sec/km to mps pace target",
    ({ secPerKm, mps }) => {
      // Arrange

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result.type).toBe("pace");
      expect(result.value?.unit).toBe("mps");
      expect(result.value?.value).toBeCloseTo(mps, 2);
    }
  );
});

describe("convertZwiftCadenceTarget", () => {
  it.each([
    { cadence: CADENCE_RPM.HIGH },
    { cadence: CADENCE_RPM.LOW },
    { cadence: CADENCE_RPM.RACE },
  ])("should keep cadence $cadence as RPM for cycling", ({ cadence }) => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(cadence, false);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: cadence },
    });
  });

  it("should default to cycling (isRunning = false)", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.HIGH);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: CADENCE_RPM.HIGH },
    });
  });

  it.each([
    { spm: CADENCE_SPM.STANDARD, rpm: CADENCE_RPM.HIGH },
    { spm: CADENCE_RPM.RUN_LOW, rpm: CADENCE_RPM.MED },
    { spm: CADENCE_RPM.RUN_HIGH, rpm: CADENCE_RPM.RUN_HIGH / 2 },
  ])("should convert $spm SPM to $rpm RPM for running", ({ spm, rpm }) => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(spm, true);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: rpm },
    });
  });
});

describe("convertKrdPaceToZwift", () => {
  it.each([
    { secPerKm: PACE_SECONDS_PER_KM.MODERATE },
    { secPerKm: PACE_SECONDS_PER_KM.FAST },
    { secPerKm: PACE_SECONDS_PER_KM.EASY },
  ])("should convert m/s back to $secPerKm seconds per km", ({ secPerKm }) => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(PACE_METERS.KILOMETER / secPerKm);

    // Assert
    expect(result).toBeCloseTo(secPerKm, 1);
  });
});

describe("convertKrdCadenceToZwift", () => {
  it("should keep RPM as-is for cycling", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.HIGH, false);

    // Assert
    expect(result).toBe(CADENCE_RPM.HIGH);
  });

  it("should default to cycling (isRunning = false)", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.HIGH);

    // Assert
    expect(result).toBe(CADENCE_RPM.HIGH);
  });

  it.each([
    { rpm: CADENCE_RPM.HIGH, spm: CADENCE_SPM.STANDARD },
    { rpm: CADENCE_RPM.MED, spm: CADENCE_RPM.RUN_LOW },
    { rpm: CADENCE_RPM.RUN_HIGH / 2, spm: CADENCE_RPM.RUN_HIGH },
  ])("should convert $rpm RPM to $spm SPM for running", ({ rpm, spm }) => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(rpm, true);

    // Assert
    expect(result).toBe(spm);
  });
});
