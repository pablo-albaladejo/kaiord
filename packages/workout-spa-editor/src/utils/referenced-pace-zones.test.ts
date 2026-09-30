import { describe, expect, it } from "vitest";

import { ALL_ZONES, paceZoneKrd } from "../test-utils/pace-zone-fixtures";
import { referencedPaceZones } from "./referenced-pace-zones";

describe("referencedPaceZones", () => {
  it("should collect pace zone numbers from steps and repetition blocks", () => {
    // Arrange
    const krd = paceZoneKrd("running", ALL_ZONES);

    // Act
    const zones = referencedPaceZones(krd);

    // Assert
    expect([...zones]).toEqual(ALL_ZONES);
  });

  it("should collect nothing from a workout without pace zone targets", () => {
    // Arrange
    const krd = { ...paceZoneKrd(), extensions: {} };

    // Act
    const zones = referencedPaceZones(krd);

    // Assert
    expect(zones.size).toBe(0);
  });
});
