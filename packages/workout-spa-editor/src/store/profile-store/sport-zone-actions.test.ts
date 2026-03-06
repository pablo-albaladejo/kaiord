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

    it("should recalculate HR zones when LTHR changes", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      useProfileStore
        .getState()
        .updateSportThresholds(id, "cycling", { lthr: 170 });

      const updated = useProfileStore.getState().getProfile(id);
      const hrZones = updated?.sportZones?.cycling?.heartRateZones;
      expect(hrZones?.method).toBe("karvonen-5");
      // Z1 max: round(170 * 82 / 100) = 139
      expect(hrZones?.zones[0]?.maxBpm).toBe(139);
    });

    it("should recalculate pace zones when threshold changes", () => {
      const profile = useProfileStore.getState().createProfile("Runner");
      const id = profile.id;

      // Set pace zone method and thresholds
      useProfileStore
        .getState()
        .setZoneMethod(id, "running", "paceZones", "daniels-5", []);
      useProfileStore.getState().updateSportThresholds(id, "running", {
        thresholdPace: 300,
        paceUnit: "min_per_km",
      });

      const updated = useProfileStore.getState().getProfile(id);
      const paceZones = updated?.sportZones?.running?.paceZones;
      expect(paceZones?.method).toBe("daniels-5");
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
    it("should update zones for a sport", () => {
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

    it("should persist custom zones", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

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
      expect(updated?.sportZones?.generic?.heartRateZones.zones).toEqual(
        customZones
      );
    });
  });

  describe("setZoneMethod", () => {
    it("should change zone method and zones", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const id = profile.id;

      const newZones = [
        { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 146 },
        { zone: 2, name: "EE", minBpm: 146, maxBpm: 160 },
        { zone: 3, name: "IE", minBpm: 162, maxBpm: 167 },
        { zone: 4, name: "Threshold", minBpm: 169, maxBpm: 178 },
        { zone: 5, name: "AC", minBpm: 180, maxBpm: 191 },
      ];

      useProfileStore
        .getState()
        .setZoneMethod(id, "cycling", "heartRateZones", "friel-hr-5", newZones);

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.method).toBe(
        "friel-hr-5"
      );
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toEqual(
        newZones
      );
    });
  });

  describe("addCustomZone", () => {
    it("should add a zone to custom config", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      useProfileStore
        .getState()
        .setZoneMethod(id, "cycling", "heartRateZones", "custom", [
          { zone: 1, name: "Z1", minBpm: 0, maxBpm: 150 },
        ]);

      useProfileStore
        .getState()
        .addCustomZone(id, "cycling", "heartRateZones", {
          zone: 2,
          name: "Z2",
          minBpm: 151,
          maxBpm: 180,
        });

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toHaveLength(
        2
      );
    });

    it("should not exceed 10 zones", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      const tenZones = Array.from({ length: 10 }, (_, i) => ({
        zone: i + 1,
        name: `Z${i + 1}`,
        minBpm: i * 20,
        maxBpm: (i + 1) * 20,
      }));

      useProfileStore
        .getState()
        .setZoneMethod(id, "cycling", "heartRateZones", "custom", tenZones);

      useProfileStore
        .getState()
        .addCustomZone(id, "cycling", "heartRateZones", {
          zone: 11,
          name: "Z11",
          minBpm: 200,
          maxBpm: 220,
        });

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toHaveLength(
        10
      );
    });
  });

  describe("removeCustomZone", () => {
    it("should remove a zone by index", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      useProfileStore
        .getState()
        .setZoneMethod(id, "cycling", "heartRateZones", "custom", [
          { zone: 1, name: "Z1", minBpm: 0, maxBpm: 130 },
          { zone: 2, name: "Z2", minBpm: 131, maxBpm: 170 },
        ]);

      useProfileStore
        .getState()
        .removeCustomZone(id, "cycling", "heartRateZones", 0);

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toHaveLength(
        1
      );
    });

    it("should not remove the last zone", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");
      const id = profile.id;

      useProfileStore
        .getState()
        .setZoneMethod(id, "cycling", "heartRateZones", "custom", [
          { zone: 1, name: "Z1", minBpm: 0, maxBpm: 150 },
        ]);

      useProfileStore
        .getState()
        .removeCustomZone(id, "cycling", "heartRateZones", 0);

      const updated = useProfileStore.getState().getProfile(id);
      expect(updated?.sportZones?.cycling?.heartRateZones.zones).toHaveLength(
        1
      );
    });
  });
});
