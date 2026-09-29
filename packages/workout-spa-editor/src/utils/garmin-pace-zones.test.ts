import { describe, expect, it } from "vitest";

import {
  paceProfile,
  paceZoneKrd,
  RUNNING_PACE_ZONES,
  RUNNING_Z1_MPS,
  RUNNING_Z2_MPS,
  SWIM_Z1_MPS,
  SWIM_ZONE_100_125,
  SWIM_ZONE_100_125_MPS,
  UNSET_RUNNING_ZONE,
} from "../test-utils/pace-zone-fixtures";
import {
  garminPaceZonesFor,
  MissingPaceZonesError,
  referencedPaceZones,
  toPaceZoneTable,
} from "./garmin-pace-zones";

describe("referencedPaceZones", () => {
  it("should collect pace zone numbers from steps and repetition blocks", () => {
    // Arrange
    const krd = paceZoneKrd();

    // Act
    const zones = referencedPaceZones(krd);

    // Assert
    expect([...zones]).toEqual([1, 2]);
  });
});

describe("toPaceZoneTable", () => {
  it("should convert seconds per km to m/s with the faster bound as maxMps", () => {
    // Arrange
    const zones = RUNNING_PACE_ZONES;

    // Act
    const table = toPaceZoneTable(zones);

    // Assert
    expect(table).toEqual([RUNNING_Z1_MPS, RUNNING_Z2_MPS]);
  });

  it("should convert seconds per 100 m for swimming zones", () => {
    // Arrange
    const zones = [SWIM_ZONE_100_125];

    // Act
    const table = toPaceZoneTable(zones);

    // Assert
    expect(table).toEqual([SWIM_ZONE_100_125_MPS]);
  });

  it("should skip a zone whose bounds were never set", () => {
    // Arrange
    const zones = [UNSET_RUNNING_ZONE];

    // Act
    const table = toPaceZoneTable(zones);

    // Assert
    expect(table).toEqual([]);
  });
});

describe("garminPaceZonesFor", () => {
  it("should resolve the running zones of the profile for a running workout", () => {
    // Arrange
    const profile = paceProfile(RUNNING_PACE_ZONES);

    // Act
    const table = garminPaceZonesFor(paceZoneKrd(), profile);

    // Assert
    expect(table?.map((z) => z.zone)).toEqual([1, 2]);
  });

  it("should resolve the swimming zones of the profile for a swimming workout", () => {
    // Arrange
    const krd = paceZoneKrd("swimming");
    const profile = paceProfile(RUNNING_PACE_ZONES);

    // Act
    const table = garminPaceZonesFor(krd, profile);

    // Assert
    expect(table?.[0]).toEqual(SWIM_Z1_MPS);
  });

  it("should need no zones for a workout without pace zone targets", () => {
    // Arrange
    const krd = { ...paceZoneKrd(), extensions: {} };

    // Act
    const table = garminPaceZonesFor(krd, null);

    // Assert
    expect(table).toBeUndefined();
  });

  it.each([
    { label: "there is no profile", profile: null },
    { label: "the profile has no running pace zones", profile: paceProfile() },
    {
      label: "the profile lacks a referenced zone",
      profile: paceProfile(RUNNING_PACE_ZONES.slice(0, 1)),
    },
  ])("should throw MissingPaceZonesError when $label", ({ profile }) => {
    // Arrange
    const krd = paceZoneKrd();

    // Act
    const act = () => garminPaceZonesFor(krd, profile);

    // Assert
    expect(act).toThrow(MissingPaceZonesError);
  });

  it("should throw MissingPaceZonesError for a sport without pace zones", () => {
    // Arrange
    const krd = paceZoneKrd("cycling");

    // Act
    const act = () => garminPaceZonesFor(krd, paceProfile(RUNNING_PACE_ZONES));

    // Assert
    expect(act).toThrow(MissingPaceZonesError);
  });
});
