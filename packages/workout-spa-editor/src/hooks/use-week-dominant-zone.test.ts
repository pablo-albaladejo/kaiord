import { describe, expect, it } from "vitest";

import {
  distanceKrd,
  ENDURANCE_STEPS,
  PCT_Z2,
  structuredKrd,
  THRESHOLD_STEPS,
} from "../test-utils/zone-profile-fixtures";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { weekDominantZone } from "./use-week-dominant-zone";

const ZONE_2 = 2;
const ZONE_4 = 4;
const KM_METERS = 1000;

const record = (krd: WorkoutRecord["krd"]): WorkoutRecord =>
  ({ krd, sport: "cycling" }) as WorkoutRecord;

const paceProfile = {
  sportZones: {
    cycling: { thresholds: { thresholdPace: 300, paceUnit: "min_per_km" } },
  },
} as unknown as Profile;

describe("weekDominantZone", () => {
  it("should answer the zone the week spends most of its classified time in", () => {
    // Arrange
    const week = [
      record(structuredKrd(THRESHOLD_STEPS)),
      record(structuredKrd(THRESHOLD_STEPS)),
    ];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBe(ZONE_4);
  });

  it("should let one session decide a week that holds only that session", () => {
    // Arrange
    const week = [record(structuredKrd(ENDURANCE_STEPS))];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBe(ZONE_2);
  });

  it("should light the core for a distance-only week with a pace threshold", () => {
    // Arrange
    const week = [record(distanceKrd(PCT_Z2, KM_METERS))];

    // Act
    const zone = weekDominantZone(week, paceProfile);

    // Assert
    expect(zone).toBe(ZONE_2);
  });

  it("should keep the core ink for a distance-only week with no pace threshold", () => {
    // Arrange
    const week = [record(distanceKrd(PCT_Z2, KM_METERS))];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBeNull();
  });

  it("should answer null for a week of raw imports, so the core stays ink", () => {
    // Arrange
    const week = [record(null), record(null)];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBeNull();
  });

  it("should answer null for an empty week", () => {
    // Arrange
    const week: WorkoutRecord[] = [];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBeNull();
  });

  it("should weight every session equally rather than by its length", () => {
    // Arrange
    const week = [
      record(structuredKrd(ENDURANCE_STEPS)),
      record(structuredKrd(ENDURANCE_STEPS)),
      record(structuredKrd(THRESHOLD_STEPS)),
    ];

    // Act
    const zone = weekDominantZone(week, null);

    // Assert
    expect(zone).toBe(ZONE_2);
  });
});
