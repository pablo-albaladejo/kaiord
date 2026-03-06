/**
 * Sport Zone Actions Tests
 *
 * Tests for sport-specific zone store actions.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useProfileStore } from "../profile-store";

describe("sport zone actions", () => {
  beforeEach(() => {
    localStorage.clear();
    useProfileStore.setState({ profiles: [], activeProfileId: null });
  });

  describe("updateSportThresholds", () => {
    it("should update thresholds for a sport", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      useProfileStore
        .getState()
        .updateSportThresholds(id, "cycling", { lthr: 165, ftp: 280 });

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.thresholds.lthr).toBe(165);
      expect(updated?.sportZones?.cycling?.thresholds.ftp).toBe(280);
    });

    it("should recalculate HR zones in auto mode when LTHR changes", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      useProfileStore
        .getState()
        .updateSportThresholds(id, "cycling", { lthr: 170 });

      const updated = useProfileStore.getState().getProfile(id);
      const hrZones = updated?.sportZones?.cycling?.heartRateZones;
      expect(hrZones?.mode).toBe("auto");
      // Z1 max: round(170 * 82 / 100) = 139
      expect(hrZones?.zones[0]?.maxBpm).toBe(139);
    });

    it("should recalculate pace zones in auto mode when threshold changes", () => {
      const profile = useProfileStore.getState().createProfile("Runner");
      const id = profile.id;

      // First set up running with auto pace zones
      useProfileStore
        .getState()
        .toggleZoneMode(id, "running", "paceZones", "auto");
      useProfileStore.getState().updateSportThresholds(id, "running", {
        thresholdPace: 300,
        paceUnit: "min_per_km",
      });

      const updated = useProfileStore.getState().getProfile(id);
      const paceZones = updated?.sportZones?.running?.paceZones;
      expect(paceZones?.mode).toBe("auto");
      expect(paceZones?.zones.length).toBe(5);
    });

    it("should do nothing for non-existent profile", () => {
      useProfileStore.getState().createProfile("Athlete");
      const before = useProfileStore.getState().profiles;

      useProfileStore
        .getState()
        .updateSportThresholds("non-existent", "cycling", { lthr: 170 });

      expect(useProfileStore.getState().profiles).toEqual(before);
    });
  });

  describe("updateSportZones", () => {
    it("should update manual zones for a sport", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      const customHrZones = [
        { zone: 1, name: "Easy", minBpm: 100, maxBpm: 130 },
        { zone: 2, name: "Moderate", minBpm: 131, maxBpm: 150 },
        { zone: 3, name: "Hard", minBpm: 151, maxBpm: 170 },
        { zone: 4, name: "Very Hard", minBpm: 171, maxBpm: 185 },
        { zone: 5, name: "Max", minBpm: 186, maxBpm: 200 },
      ];

      useProfileStore
        .getState()
        .updateSportZones(id, "cycling", "heartRateZones", customHrZones);

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toEqual(
        customHrZones
      );
    });

    it("should persist custom zones in manual mode", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      useProfileStore
        .getState()
        .toggleZoneMode(id, "generic", "heartRateZones", "manual");

      const customZones = [
        { zone: 1, name: "Z1", minBpm: 90, maxBpm: 120 },
        { zone: 2, name: "Z2", minBpm: 121, maxBpm: 140 },
        { zone: 3, name: "Z3", minBpm: 141, maxBpm: 160 },
        { zone: 4, name: "Z4", minBpm: 161, maxBpm: 175 },
        { zone: 5, name: "Z5", minBpm: 176, maxBpm: 195 },
      ];

      useProfileStore
        .getState()
        .updateSportZones(id, "generic", "heartRateZones", customZones);

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.generic?.heartRateZones.mode).toBe("manual");
      expect(updated?.sportZones?.generic?.heartRateZones.zones).toEqual(
        customZones
      );
    });
  });

  describe("toggleZoneMode", () => {
    it("should toggle from manual to auto and recalculate zones", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      // Set to manual first
      useProfileStore
        .getState()
        .toggleZoneMode(id, "cycling", "heartRateZones", "manual");

      // Toggle back to auto
      useProfileStore
        .getState()
        .toggleZoneMode(id, "cycling", "heartRateZones", "auto");

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.mode).toBe("auto");
    });

    it("should switch to manual mode without recalculating", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      const autoZones = profile.sportZones?.cycling?.heartRateZones.zones ?? [];

      useProfileStore
        .getState()
        .toggleZoneMode(id, "cycling", "heartRateZones", "manual");

      const updated = useProfileStore.getState().getProfile(id);
      const hrZones = updated?.sportZones?.cycling?.heartRateZones;
      expect(hrZones?.mode).toBe("manual");
      expect(hrZones?.zones).toEqual(autoZones);
    });
  });
});
