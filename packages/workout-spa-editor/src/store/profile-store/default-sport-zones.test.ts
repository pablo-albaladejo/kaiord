/**
 * Default Sport Zones Tests
 *
 * Verify new profiles get correct sportZones structure.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useProfileStore } from "../profile-store";

describe("default sport zones for new profiles", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.setState({ profiles: [], activeProfileId: null });
  });

  it("should initialize sportZones for all 4 sports", () => {
    const profile = useProfileStore.getState().createProfile("Athlete");

    expect(profile.sportZones).toBeDefined();
    expect(profile.sportZones.cycling).toBeDefined();
    expect(profile.sportZones.running).toBeDefined();
    expect(profile.sportZones.swimming).toBeDefined();
    expect(profile.sportZones.generic).toBeDefined();
  });

  it("should have heartRateZones for all sports", () => {
    const profile = useProfileStore.getState().createProfile("Athlete");
    const sz = profile.sportZones;

    expect(sz.cycling?.heartRateZones).toBeDefined();
    expect(sz.running?.heartRateZones).toBeDefined();
    expect(sz.swimming?.heartRateZones).toBeDefined();
    expect(sz.generic?.heartRateZones).toBeDefined();
  });

  it("should have powerZones for cycling with default zones", () => {
    const profile = useProfileStore.getState().createProfile("Cyclist");
    const cycling = profile.sportZones.cycling;

    expect(cycling?.powerZones).toBeDefined();
    expect(cycling?.powerZones?.zones).toHaveLength(7);
  });

  it("should use custom method for HR when no thresholds set", () => {
    const profile = useProfileStore.getState().createProfile("Beginner");
    const cycling = profile.sportZones.cycling;

    expect(cycling?.heartRateZones.method).toBe("custom");
  });
});
