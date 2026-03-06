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
    expect(profile.sportZones?.cycling).toBeDefined();
    expect(profile.sportZones?.running).toBeDefined();
    expect(profile.sportZones?.swimming).toBeDefined();
    expect(profile.sportZones?.generic).toBeDefined();
  });

  it("should have heartRateZones for all sports", () => {
    const profile = useProfileStore.getState().createProfile("Athlete");
    const sz = profile.sportZones!;

    expect(sz.cycling?.heartRateZones).toBeDefined();
    expect(sz.running?.heartRateZones).toBeDefined();
    expect(sz.swimming?.heartRateZones).toBeDefined();
    expect(sz.generic?.heartRateZones).toBeDefined();
  });

  it("should have powerZones for cycling with default zones", () => {
    const profile = useProfileStore.getState().createProfile("Cyclist");
    const cycling = profile.sportZones?.cycling;

    expect(cycling?.powerZones).toBeDefined();
    expect(cycling?.powerZones?.zones).toHaveLength(7);
  });

  it("should use karvonen method for HR when maxHeartRate is provided", () => {
    const profile = useProfileStore
      .getState()
      .createProfile("Runner", { maxHeartRate: 180 });
    const cycling = profile.sportZones?.cycling;

    expect(cycling?.heartRateZones.method).toBe("karvonen-5");
    expect(cycling?.heartRateZones.zones).toHaveLength(5);
    expect(cycling?.heartRateZones.zones[0].maxBpm).toBeGreaterThan(0);
  });

  it("should use custom method for HR when no maxHeartRate", () => {
    const profile = useProfileStore.getState().createProfile("Beginner");
    const cycling = profile.sportZones?.cycling;

    expect(cycling?.heartRateZones.method).toBe("custom");
  });

  it("should carry FTP to cycling thresholds", () => {
    const profile = useProfileStore
      .getState()
      .createProfile("Cyclist", { ftp: 250 });

    expect(profile.sportZones?.cycling?.thresholds.ftp).toBe(250);
  });
});
