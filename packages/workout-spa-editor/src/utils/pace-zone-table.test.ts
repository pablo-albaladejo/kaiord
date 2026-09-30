import { describe, expect, it } from "vitest";

import { PACE_MODEL } from "../lib/athlete/zone-models";
import {
  ALL_ZONES,
  danielsZones,
  editorZone,
  MPS_DIGITS,
  RUN_THRESHOLD,
} from "../test-utils/pace-zone-fixtures";
import {
  OPEN_END_FACTOR,
  storedZoneTable,
  thresholdZoneTable,
} from "./pace-zone-table";

const KM = 1000;
const SLOW = 420;
const FAST = 360;

describe("storedZoneTable", () => {
  it("should convert both bounds to m/s with the faster bound as maxMps", () => {
    // Arrange
    const zones = [editorZone(1, FAST, SLOW)];

    // Act
    const [z1] = storedZoneTable(zones, KM);

    // Assert
    expect(z1).toEqual({ zone: 1, minMps: KM / SLOW, maxMps: KM / FAST });
  });

  it("should keep a zone with an open fast end, as calculatePaceZones stores Z5", () => {
    // Arrange
    const zones = danielsZones(RUN_THRESHOLD);
    const z5SlowEnd = zones[4]!.maxPace;

    // Act
    const table = storedZoneTable(zones, KM);

    // Assert
    expect(table.map((z) => z.zone)).toEqual(ALL_ZONES);
    expect(table[4]!.minMps).toBeCloseTo(KM / z5SlowEnd, MPS_DIGITS);
    expect(table[4]!.maxMps).toBeCloseTo(
      (KM / z5SlowEnd) * OPEN_END_FACTOR,
      MPS_DIGITS
    );
  });

  it("should keep a zone with an open slow end", () => {
    // Arrange
    const zones = [editorZone(1, FAST, 0)];

    // Act
    const [z1] = storedZoneTable(zones, KM);

    // Assert
    expect(z1!.maxMps).toBeCloseTo(KM / FAST, MPS_DIGITS);
    expect(z1!.minMps).toBeCloseTo(KM / FAST / OPEN_END_FACTOR, MPS_DIGITS);
  });

  it("should leave out a zone whose bounds were never set", () => {
    // Arrange
    const zones = [editorZone(1, 0, 0)];

    // Act
    const table = storedZoneTable(zones, KM);

    // Assert
    expect(table).toEqual([]);
  });
});

describe("thresholdZoneTable", () => {
  it("should bound Z1–Z5 by the zone map's speed fractions of the threshold", () => {
    // Arrange
    const speed = KM / RUN_THRESHOLD;
    const [b1, b2, b3, b4] = PACE_MODEL.bounds;

    // Act
    const table = thresholdZoneTable(RUN_THRESHOLD, KM);

    // Assert
    expect(table).toEqual([
      { zone: 1, minMps: (b1 * speed) / OPEN_END_FACTOR, maxMps: b1 * speed },
      { zone: 2, minMps: b1 * speed, maxMps: b2 * speed },
      { zone: 3, minMps: b2 * speed, maxMps: b3 * speed },
      { zone: 4, minMps: b3 * speed, maxMps: b4 * speed },
      { zone: 5, minMps: b4 * speed, maxMps: b4 * speed * OPEN_END_FACTOR },
    ]);
  });
});
