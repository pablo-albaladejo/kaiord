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
import { dominantZone } from "./zone-emphasis";
import { zoneSeconds, zoneSegments } from "./zone-profile";

const NO_THRESHOLDS = {};
const PACE_THRESHOLDS = {
  thresholdPace: 300,
  paceUnit: "min_per_km",
} as const;

const EXPECTED_THRESHOLD_SEGMENTS = 5;
const ZONE_2 = 2;
const ZONE_4 = 4;
const KM_METERS = 1000;
const ESTIMATED_KM_SECONDS = 300;

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

  it("should drop a distance step when no pace threshold allows an estimate", () => {
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

  it("should estimate a distance step's seconds from the pace threshold", () => {
    // Arrange
    // 1000 m at a 300 s/km threshold → 1000 / (1000/300) = 300 s.
    const workout = structuredWorkout([]);
    workout.steps.push({
      stepIndex: 0,
      durationType: "distance",
      duration: { type: "distance", meters: KM_METERS },
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: PCT_Z2 } },
    });

    // Act
    const segments = zoneSegments(workout, PACE_THRESHOLDS);

    // Assert
    expect(segments).toEqual([{ zone: ZONE_2, seconds: ESTIMATED_KM_SECONDS }]);
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
  // The single implementation lives in zone-emphasis (ties resolve DOWNWARD;
  // its own suite pins that). This case pins the pipeline composition.
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
