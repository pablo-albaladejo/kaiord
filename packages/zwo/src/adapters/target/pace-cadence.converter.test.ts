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

  it("should handle fast pace (4 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(PACE_SECONDS_PER_KM.FAST);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(SPEED_MPS.PACE_4_167, 2);
  });

  it("should handle slow pace (6 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(PACE_SECONDS_PER_KM.SLOW);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(SPEED_MPS.PACE_2_778, 2);
  });

  it("should handle very fast pace (3 min/km)", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(PACE_SECONDS_PER_KM.VERY_FAST);

    // Assert
    expect(result.type).toBe("pace");
    expect(result.value?.value).toBeCloseTo(SPEED_MPS.PACE_5_556, 2);
  });

  it("should use mps as unit", () => {
    // Arrange

    // Act
    const result = convertZwiftPaceTarget(PACE_SECONDS_PER_KM.MODERATE);

    // Assert
    expect(result.value?.unit).toBe("mps");
  });
});

describe("convertZwiftCadenceTarget", () => {
  it("should keep cadence as RPM for cycling", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.HIGH, false);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: CADENCE_RPM.HIGH },
    });
  });

  it("should convert SPM to RPM for running", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_SPM.STANDARD, true);

    // Assert
    expect(result).toStrictEqual({
      type: "cadence",
      value: { unit: "rpm", value: CADENCE_RPM.HIGH },
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

  it("should handle low cycling cadence", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.LOW);

    // Assert
    expect(result.value?.value).toBe(CADENCE_RPM.LOW);
  });

  it("should handle high cycling cadence", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.RACE);

    // Assert
    expect(result.value?.value).toBe(CADENCE_RPM.RACE);
  });

  it("should handle running cadence of 160 SPM", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.RUN_LOW, true);

    // Assert
    expect(result.value?.value).toBe(CADENCE_RPM.MED);
  });

  it("should handle running cadence of 200 SPM", () => {
    // Arrange

    // Act
    const result = convertZwiftCadenceTarget(CADENCE_RPM.RUN_HIGH, true);

    // Assert
    expect(result.value?.value).toBe(CADENCE_RPM.RUN_HIGH / 2);
  });
});

describe("convertKrdPaceToZwift", () => {
  it("should convert m/s to seconds per km", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(
      PACE_METERS.KILOMETER / PACE_SECONDS_PER_KM.MODERATE
    );

    // Assert
    expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.MODERATE, 1);
  });

  it("should handle fast running pace", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(
      PACE_METERS.KILOMETER / PACE_SECONDS_PER_KM.FAST
    );

    // Assert
    expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.FAST, 1);
  });

  it("should handle slow walking pace", () => {
    // Arrange

    // Act
    const result = convertKrdPaceToZwift(
      PACE_METERS.KILOMETER / PACE_SECONDS_PER_KM.EASY
    );

    // Assert
    expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.EASY, 1);
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

  it("should convert RPM to SPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.HIGH, true);

    // Assert
    expect(result).toBe(CADENCE_SPM.STANDARD);
  });

  it("should default to cycling (isRunning = false)", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.HIGH);

    // Assert
    expect(result).toBe(CADENCE_RPM.HIGH);
  });

  it("should handle low RPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.MED, true);

    // Assert
    expect(result).toBe(CADENCE_RPM.RUN_LOW);
  });

  it("should handle high RPM for running", () => {
    // Arrange

    // Act
    const result = convertKrdCadenceToZwift(CADENCE_RPM.RUN_HIGH / 2, true);

    // Assert
    expect(result).toBe(CADENCE_RPM.RUN_HIGH);
  });
});
