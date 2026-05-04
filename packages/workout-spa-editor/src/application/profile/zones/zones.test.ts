/**
 * Co-located tests for the 5 per-sport zone use cases.
 *
 * One file covers all 5 because they share fixtures (profile with
 * cycling/running/swimming sport configs) and the assertions are
 * mechanically symmetric. Each use case has dedicated success-path,
 * profile-not-found, and (where the helper short-circuits) no-op
 * coverage.
 */

import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { HeartRateZone } from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { makeProfile, seedProfile } from "../test-fixtures";
import { addCustomZone } from "./add-custom-zone";
import { removeCustomZone } from "./remove-custom-zone";
import { setZoneMethod } from "./set-zone-method";
import { updateSportThresholds } from "./update-sport-thresholds";
import { updateSportZones } from "./update-sport-zones";

const HR_ZONE: HeartRateZone = {
  zone: 1,
  name: "Recovery",
  minBpm: 50,
  maxBpm: 110,
};

describe("updateSportThresholds", () => {
  it("should recalculate pace zones when threshold pace is set with daniels-5 (running)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    profile.sportZones.running!.paceZones = {
      method: "daniels-5",
      zones: [],
    };
    await seedProfile(persistence, profile);

    // Act
    const updated = await updateSportThresholds(
      persistence,
      profile.id,
      "running",
      { thresholdPace: 300, paceUnit: "min_per_km" }
    );

    // Assert
    expect(updated.sportZones.running?.paceZones?.method).toBe("daniels-5");
    expect(updated.sportZones.running?.paceZones?.zones).toHaveLength(5);
  });

  it("should recalculate HR zones when LTHR is set and method is non-custom", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    profile.sportZones.cycling!.heartRateZones = {
      method: "karvonen-5",
      zones: [],
    };
    await seedProfile(persistence, profile);

    // Act
    const updated = await updateSportThresholds(
      persistence,
      profile.id,
      "cycling",
      { lthr: 170 }
    );

    // Assert
    expect(updated.sportZones.cycling?.thresholds.lthr).toBe(170);
    expect(
      updated.sportZones.cycling?.heartRateZones.zones.length
    ).toBeGreaterThan(0);
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      updateSportThresholds(persistence, "missing", "cycling", {})
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});

describe("updateSportZones", () => {
  it("should replace the zones array for the (sport, zoneType) pair", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);

    // Act
    const updated = await updateSportZones(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      [HR_ZONE]
    );

    // Assert
    expect(updated.sportZones.cycling?.heartRateZones.zones).toEqual([HR_ZONE]);
  });

  it("should be a no-op when the zoneType is missing on the sport config", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);

    // Act
    const updated = await updateSportZones(
      persistence,
      profile.id,
      "swimming",
      "powerZones",
      [HR_ZONE]
    );

    // Assert
    expect(updated.sportZones.swimming?.powerZones).toBeUndefined();
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      updateSportZones(persistence, "missing", "cycling", "heartRateZones", [])
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});

describe("setZoneMethod", () => {
  it("should set method and zones together", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);

    // Act
    const updated = await setZoneMethod(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      "karvonen-5",
      [HR_ZONE]
    );

    // Assert
    expect(updated.sportZones.cycling?.heartRateZones.method).toBe(
      "karvonen-5"
    );
    expect(updated.sportZones.cycling?.heartRateZones.zones).toEqual([HR_ZONE]);
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      setZoneMethod(
        persistence,
        "missing",
        "cycling",
        "heartRateZones",
        "x",
        []
      )
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});

describe("addCustomZone", () => {
  it("should append a zone within the 10-zone bound", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);
    const updated = await addCustomZone(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      HR_ZONE
    );

    // Act
    const zones = updated.sportZones.cycling?.heartRateZones.zones ?? [];

    // Assert
    expect(zones[zones.length - 1]).toEqual(HR_ZONE);
  });

  it("should be a no-op when the zoneType is missing on the sport config", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    await seedProfile(persistence, profile);

    // Act
    const updated = await addCustomZone(
      persistence,
      profile.id,
      "swimming",
      "powerZones",
      HR_ZONE
    );

    // Assert
    expect(updated.sportZones.swimming?.powerZones).toBeUndefined();
  });

  it("should be a no-op once the 10-zone limit is reached", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    profile.sportZones.cycling!.heartRateZones = {
      method: "custom",
      zones: Array.from({ length: 10 }, (_, i) => ({
        ...HR_ZONE,
        zone: i + 1,
      })),
    };
    await seedProfile(persistence, profile);

    // Act
    const updated = await addCustomZone(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      HR_ZONE
    );

    // Assert
    expect(updated.sportZones.cycling?.heartRateZones.zones).toHaveLength(10);
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      addCustomZone(
        persistence,
        "missing",
        "cycling",
        "heartRateZones",
        HR_ZONE
      )
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});

describe("removeCustomZone", () => {
  it("should remove the zone at the given index", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    profile.sportZones.cycling!.heartRateZones = {
      method: "custom",
      zones: [
        { ...HR_ZONE, zone: 1 },
        { ...HR_ZONE, zone: 2 },
        { ...HR_ZONE, zone: 3 },
      ],
    };
    await seedProfile(persistence, profile);
    const updated = await removeCustomZone(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      1
    );

    // Act
    const zones = updated.sportZones.cycling?.heartRateZones.zones ?? [];

    // Assert
    expect(zones).toHaveLength(2);
    expect(zones.map((z) => z.zone)).toEqual([1, 3]);
  });

  it("should be a no-op when only one zone remains", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = makeProfile();
    profile.sportZones.cycling!.heartRateZones = {
      method: "custom",
      zones: [HR_ZONE],
    };
    await seedProfile(persistence, profile);

    // Act
    const updated = await removeCustomZone(
      persistence,
      profile.id,
      "cycling",
      "heartRateZones",
      0
    );

    // Assert
    expect(updated.sportZones.cycling?.heartRateZones.zones).toHaveLength(1);
  });

  it("should throw ProfileNotFoundError for an unknown id", async () => {
    // Arrange

    // Act
    const persistence = createInMemoryPersistence();

    // Assert
    await expect(
      removeCustomZone(persistence, "missing", "cycling", "heartRateZones", 0)
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
