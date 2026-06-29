import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createProfile } from "./create-profile";

describe("createProfile", () => {
  it("should persist a profile and selects it as active when none existed", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const profile = await createProfile(persistence, "Pablo");

    // Assert
    expect(profile.name).toBe("Pablo");
    expect(profile.id).toBeDefined();
    expect(await persistence.profiles.getAll()).toHaveLength(1);
    expect(await persistence.profiles.getActiveId()).toBe(profile.id);
  });

  it("should preserve the existing active id when a profile already exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const first = await createProfile(persistence, "First");

    // Act
    const second = await createProfile(persistence, "Second");

    // Assert
    expect(await persistence.profiles.getAll()).toHaveLength(2);
    expect(await persistence.profiles.getActiveId()).toBe(first.id);
    expect(second.id).not.toBe(first.id);
  });

  it("should initialize the default sportZones structure for all 4 sports", async () => {
    // Arrange
    const BODY_WEIGHT_KG = 70;
    const POWER_ZONE_COUNT = 7;
    const persistence = createInMemoryPersistence();

    // Act
    const profile = await createProfile(persistence, "Athlete", {
      bodyWeight: BODY_WEIGHT_KG,
    });

    // Assert
    expect(profile.bodyWeight).toBe(BODY_WEIGHT_KG);
    expect(profile.sportZones.cycling).toBeDefined();
    expect(profile.sportZones.running).toBeDefined();
    expect(profile.sportZones.swimming).toBeDefined();
    expect(profile.sportZones.generic).toBeDefined();
    expect(profile.sportZones.cycling?.heartRateZones).toBeDefined();
    expect(profile.sportZones.running?.heartRateZones).toBeDefined();
    expect(profile.sportZones.swimming?.heartRateZones).toBeDefined();
    expect(profile.sportZones.generic?.heartRateZones).toBeDefined();
    expect(profile.sportZones.cycling?.powerZones?.zones).toHaveLength(
      POWER_ZONE_COUNT
    );
    expect(profile.sportZones.cycling?.powerZones?.zones[0]?.name).toBe(
      "Active Recovery"
    );
    expect(profile.sportZones.cycling?.heartRateZones.method).toBe("custom");
  });

  it("should roll back the put when setActiveId rejects on the first profile (transaction atomicity)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    persistence.profiles.setActiveId = () =>
      Promise.reject(new Error("simulated"));

    // Assert
    await expect(createProfile(persistence, "Pablo")).rejects.toThrow(
      "simulated"
    );
    expect(await persistence.profiles.getAll()).toEqual([]);
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });
});
