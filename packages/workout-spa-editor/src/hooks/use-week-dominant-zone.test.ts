import { describe, expect, it } from "vitest";

import {
  ENDURANCE_STEPS,
  structuredKrd,
  THRESHOLD_STEPS,
} from "../test-utils/zone-profile-fixtures";
import type { WorkoutRecord } from "../types/calendar-record";
import { weekDominantZone } from "./use-week-dominant-zone";

const ZONE_2 = 2;
const ZONE_4 = 4;

const record = (krd: WorkoutRecord["krd"]): WorkoutRecord =>
  ({ krd, sport: "cycling" }) as WorkoutRecord;

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
