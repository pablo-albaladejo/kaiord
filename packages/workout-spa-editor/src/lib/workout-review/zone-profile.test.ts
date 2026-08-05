import { describe, expect, it } from "vitest";

import {
  ENDURANCE_STEPS,
  LONG_STEP_SECONDS,
  PCT_Z1,
  PCT_Z2,
  SHORT_STEP_SECONDS,
  structuredWorkout,
  THRESHOLD_STEPS,
} from "../../test-utils/zone-profile-fixtures";
import { dominantZone, zoneSeconds, zoneSegments } from "./zone-profile";

const NO_THRESHOLDS = {};

const EXPECTED_THRESHOLD_SEGMENTS = 5;
const ZONE_2 = 2;
const ZONE_4 = 4;
const ZONE_5 = 5;
const HALF = 0.5;

describe("zoneSegments", () => {
  it("should emit one segment per contiguous run of the same zone", () => {
    // Arrange
    const workout = structuredWorkout(THRESHOLD_STEPS);

    // Act
    const segments = zoneSegments(workout, NO_THRESHOLDS);

    // Assert
    expect(segments).toHaveLength(EXPECTED_THRESHOLD_SEGMENTS);
  });

  it("should merge adjacent steps that land in the same zone", () => {
    // Arrange
    const workout = structuredWorkout([
      { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
      { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
    ]);

    // Act
    const segments = zoneSegments(workout, NO_THRESHOLDS);

    // Assert
    expect(segments).toEqual([
      { zone: ZONE_2, seconds: SHORT_STEP_SECONDS * ZONE_2 },
    ]);
  });

  it("should drop a step whose target does not classify", () => {
    // Arrange
    const workout = structuredWorkout(ENDURANCE_STEPS);
    workout.steps.push({
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: SHORT_STEP_SECONDS },
      targetType: "open",
      target: { type: "open" },
    });

    // Act
    const segments = zoneSegments(workout, NO_THRESHOLDS);

    // Assert
    expect(segments).toEqual([{ zone: ZONE_2, seconds: LONG_STEP_SECONDS }]);
  });

  it("should drop a step with no time-based duration", () => {
    // Arrange
    const workout = structuredWorkout(ENDURANCE_STEPS);
    workout.steps.push({
      stepIndex: 1,
      durationType: "distance",
      duration: { type: "distance", meters: LONG_STEP_SECONDS },
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: PCT_Z1 } },
    });

    // Act
    const segments = zoneSegments(workout, NO_THRESHOLDS);

    // Assert
    expect(segments).toHaveLength(1);
  });

  it("should return nothing for a workout with no steps", () => {
    // Arrange
    const workout = structuredWorkout([]);

    // Act
    const segments = zoneSegments(workout, NO_THRESHOLDS);

    // Assert
    expect(segments).toEqual([]);
  });
});

describe("dominantZone", () => {
  it("should pick the zone holding the most classified time", () => {
    // Arrange
    const segments = zoneSegments(
      structuredWorkout(THRESHOLD_STEPS),
      NO_THRESHOLDS
    );

    // Act
    const zone = dominantZone(zoneSeconds(segments));

    // Assert
    expect(zone).toBe(ZONE_4);
  });

  it("should resolve a tie to the harder zone", () => {
    // Arrange
    const dist = [0, HALF, 0, 0, HALF];

    // Act
    const zone = dominantZone(dist);

    // Assert
    expect(zone).toBe(ZONE_5);
  });

  it("should answer null when nothing classified", () => {
    // Arrange
    const dist = [0, 0, 0, 0, 0];

    // Act
    const zone = dominantZone(dist);

    // Assert
    expect(zone).toBeNull();
  });
});

describe("zoneSeconds", () => {
  it("should total the segments per zone without normalising", () => {
    // Arrange
    const segments = zoneSegments(
      structuredWorkout(ENDURANCE_STEPS),
      NO_THRESHOLDS
    );

    // Act
    const totals = zoneSeconds(segments);

    // Assert
    expect(totals[ZONE_2 - 1]).toBe(LONG_STEP_SECONDS);
  });
});
