import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createProfile } from "./create-profile";

describe("createProfile", () => {
  it("persists a profile and selects it as active when none existed", async () => {
    const persistence = createInMemoryPersistence();

    const profile = await createProfile(persistence, "Pablo");

    expect(profile.name).toBe("Pablo");
    expect(profile.id).toBeDefined();
    expect(await persistence.profiles.getAll()).toHaveLength(1);
    expect(await persistence.profiles.getActiveId()).toBe(profile.id);
  });

  it("preserves the existing active id when a profile already exists", async () => {
    const persistence = createInMemoryPersistence();
    const first = await createProfile(persistence, "First");

    const second = await createProfile(persistence, "Second");

    expect(await persistence.profiles.getAll()).toHaveLength(2);
    expect(await persistence.profiles.getActiveId()).toBe(first.id);
    expect(second.id).not.toBe(first.id);
  });

  it("initializes the default sportZones structure for all 4 sports", async () => {
    const persistence = createInMemoryPersistence();

    const profile = await createProfile(persistence, "Athlete", {
      bodyWeight: 70,
    });

    expect(profile.bodyWeight).toBe(70);
    expect(profile.sportZones.cycling).toBeDefined();
    expect(profile.sportZones.running).toBeDefined();
    expect(profile.sportZones.swimming).toBeDefined();
    expect(profile.sportZones.generic).toBeDefined();
    expect(profile.sportZones.cycling?.heartRateZones).toBeDefined();
    expect(profile.sportZones.running?.heartRateZones).toBeDefined();
    expect(profile.sportZones.swimming?.heartRateZones).toBeDefined();
    expect(profile.sportZones.generic?.heartRateZones).toBeDefined();
    // Cycling power zones default to coggan-7 with 7 zones; the first
    // zone is "Active Recovery". Locks the legacy structural contract
    // (migrated from the deleted profile-store.test.ts).
    expect(profile.sportZones.cycling?.powerZones?.zones).toHaveLength(7);
    expect(profile.sportZones.cycling?.powerZones?.zones[0]?.name).toBe(
      "Active Recovery"
    );
    // No thresholds set yet → HR method falls back to "custom".
    expect(profile.sportZones.cycling?.heartRateZones.method).toBe("custom");
  });

  it("generates a fresh id per profile", async () => {
    const persistence = createInMemoryPersistence();

    const a = await createProfile(persistence, "A");
    const b = await createProfile(persistence, "B");

    expect(a.id).not.toBe(b.id);
  });

  it("rolls back the put when setActiveId rejects on the first profile (transaction atomicity)", async () => {
    const persistence = createInMemoryPersistence();
    persistence.profiles.setActiveId = () =>
      Promise.reject(new Error("simulated"));

    await expect(createProfile(persistence, "Pablo")).rejects.toThrow(
      "simulated"
    );

    expect(await persistence.profiles.getAll()).toEqual([]);
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });
});
