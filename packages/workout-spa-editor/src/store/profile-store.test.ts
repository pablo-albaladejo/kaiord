/**
 * Profile Store Tests
 *
 * Tests for the Zustand profile store implementation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeartRateZone, PowerZone } from "../types/profile";
import * as profileStorage from "../utils/profile-storage";
import { useProfileStore } from "./profile-store";

describe("useProfileStore", () => {
  // Reset store and localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useProfileStore.setState({
      profiles: [],
      activeProfileId: null,
    });
  });

  describe("initial state", () => {
    it("should have empty profiles array initially", () => {
      // Arrange & Act
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles).toEqual([]);
    });

    it("should have null activeProfileId initially", () => {
      // Arrange & Act
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("should create a profile with name only", () => {
      // Arrange
      const name = "Test Athlete";

      // Act
      const profile = useProfileStore.getState().createProfile(name);
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles).toHaveLength(1);
      expect(profile.name).toBe(name);
      expect(profile.id).toBeDefined();
      expect(profile.bodyWeight).toBeUndefined();
      expect(profile.ftp).toBeUndefined();
      expect(profile.maxHeartRate).toBeUndefined();
      expect(profile.powerZones).toHaveLength(7);
      expect(profile.heartRateZones).toHaveLength(5);
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it("should create a profile with all options", () => {
      // Arrange
      const name = "Pro Cyclist";
      const options = {
        bodyWeight: 70,
        ftp: 300,
        maxHeartRate: 190,
      };

      // Act
      const profile = useProfileStore.getState().createProfile(name, options);

      // Assert
      expect(profile.name).toBe(name);
      expect(profile.bodyWeight).toBe(70);
      expect(profile.ftp).toBe(300);
      expect(profile.maxHeartRate).toBe(190);
    });

    it("should calculate heart rate zones when maxHeartRate is provided", () => {
      // Arrange
      const name = "Runner";
      const maxHeartRate = 180;

      // Act
      const profile = useProfileStore
        .getState()
        .createProfile(name, { maxHeartRate });

      // Assert
      expect(profile.heartRateZones[0].minBpm).toBe(0);
      expect(profile.heartRateZones[0].maxBpm).toBe(108); // 60% of 180
      expect(profile.heartRateZones[4].minBpm).toBe(162); // 90% of 180
      expect(profile.heartRateZones[4].maxBpm).toBe(180); // 100% of 180
    });

    it("should use default heart rate zones when maxHeartRate is not provided", () => {
      // Arrange
      const name = "Beginner";

      // Act
      const profile = useProfileStore.getState().createProfile(name);

      // Assert
      expect(profile.heartRateZones).toHaveLength(5);
      expect(profile.heartRateZones[0].minBpm).toBe(0);
      expect(profile.heartRateZones[0].maxBpm).toBe(0);
    });

    it("should set first profile as active", () => {
      // Arrange
      const name = "First Profile";

      // Act
      const profile = useProfileStore.getState().createProfile(name);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(profile.id);
    });

    it("should not change active profile when creating second profile", () => {
      // Arrange
      const profile1 = useProfileStore.getState().createProfile("Profile 1");

      // Act
      useProfileStore.getState().createProfile("Profile 2");
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(profile1.id);
      expect(state.profiles).toHaveLength(2);
    });

    it("should generate unique IDs for each profile", () => {
      // Arrange & Act
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");

      // Assert
      expect(profile1.id).not.toBe(profile2.id);
    });

    it("should use default power zones", () => {
      // Arrange
      const name = "Cyclist";

      // Act
      const profile = useProfileStore.getState().createProfile(name);

      // Assert
      expect(profile.powerZones).toHaveLength(7);
      expect(profile.powerZones[0].zone).toBe(1);
      expect(profile.powerZones[0].name).toBe("Active Recovery");
      expect(profile.powerZones[6].zone).toBe(7);
      expect(profile.powerZones[6].name).toBe("Neuromuscular Power");
    });
  });

  describe("updateProfile", () => {
    it("should update profile name", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Old Name");
      const newName = "New Name";
      const originalUpdatedAt = profile.updatedAt;

      // Act
      useProfileStore.getState().updateProfile(profile.id, { name: newName });
      const state = useProfileStore.getState();

      // Assert
      const updatedProfile = state.profiles[0];
      expect(updatedProfile.name).toBe(newName);
      expect(updatedProfile.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it("should update FTP", () => {
      // Arrange
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { ftp: 250 });

      // Act
      useProfileStore.getState().updateProfile(profile.id, { ftp: 280 });
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles[0].ftp).toBe(280);
    });

    it("should update body weight", () => {
      // Arrange
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { bodyWeight: 70 });

      // Act
      useProfileStore.getState().updateProfile(profile.id, { bodyWeight: 72 });
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles[0].bodyWeight).toBe(72);
    });

    it("should recalculate heart rate zones when maxHeartRate changes", () => {
      // Arrange
      const profile = useProfileStore
        .getState()
        .createProfile("Runner", { maxHeartRate: 180 });
      const oldZones = profile.heartRateZones;

      // Act
      useProfileStore
        .getState()
        .updateProfile(profile.id, { maxHeartRate: 190 });
      const state = useProfileStore.getState();

      // Assert
      const updatedProfile = state.profiles[0];
      expect(updatedProfile.maxHeartRate).toBe(190);
      expect(updatedProfile.heartRateZones).not.toEqual(oldZones);
      expect(updatedProfile.heartRateZones[4].maxBpm).toBe(190);
    });

    it("should not recalculate heart rate zones when other fields change", () => {
      // Arrange
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { maxHeartRate: 180 });
      const originalZones = profile.heartRateZones;

      // Act
      useProfileStore.getState().updateProfile(profile.id, { ftp: 300 });
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles[0].heartRateZones).toEqual(originalZones);
    });

    it("should do nothing when profile ID does not exist", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Athlete");
      const nonExistentId = "non-existent-id";

      // Act
      useProfileStore.getState().updateProfile(nonExistentId, { name: "New" });
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].name).toBe(profile.name);
    });

    it("should update multiple fields at once", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Athlete");

      // Act
      useProfileStore.getState().updateProfile(profile.id, {
        name: "Pro Athlete",
        ftp: 350,
        bodyWeight: 68,
        maxHeartRate: 185,
      });
      const state = useProfileStore.getState();

      // Assert
      const updated = state.profiles[0];
      expect(updated.name).toBe("Pro Athlete");
      expect(updated.ftp).toBe(350);
      expect(updated.bodyWeight).toBe(68);
      expect(updated.maxHeartRate).toBe(185);
    });
  });

  describe("deleteProfile", () => {
    it("should remove profile from store", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("To Delete");

      // Act
      useProfileStore.getState().deleteProfile(profile.id);
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles).toHaveLength(0);
    });

    it("should set activeProfileId to null when deleting the only profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Only Profile");

      // Act
      useProfileStore.getState().deleteProfile(profile.id);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBeNull();
    });

    it("should set activeProfileId to first remaining profile when deleting active profile", () => {
      // Arrange
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");
      useProfileStore.getState().setActiveProfile(profile1.id);

      // Act
      useProfileStore.getState().deleteProfile(profile1.id);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(profile2.id);
      expect(state.profiles).toHaveLength(1);
    });

    it("should preserve activeProfileId when deleting non-active profile", () => {
      // Arrange
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");
      useProfileStore.getState().setActiveProfile(profile1.id);

      // Act
      useProfileStore.getState().deleteProfile(profile2.id);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(profile1.id);
      expect(state.profiles).toHaveLength(1);
    });

    it("should do nothing when profile ID does not exist", () => {
      // Arrange
      useProfileStore.getState().createProfile("Profile");
      const nonExistentId = "non-existent-id";

      // Act
      useProfileStore.getState().deleteProfile(nonExistentId);
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles).toHaveLength(1);
    });
  });

  describe("setActiveProfile", () => {
    it("should set active profile by ID", () => {
      // Arrange
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");

      // Act
      useProfileStore.getState().setActiveProfile(profile2.id);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(profile2.id);
    });

    it("should allow setting activeProfileId to null", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Profile");

      // Act
      useProfileStore.getState().setActiveProfile(null);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBeNull();
    });

    it("should allow setting non-existent profile ID", () => {
      // Arrange
      useProfileStore.getState().createProfile("Profile");
      const nonExistentId = "non-existent-id";

      // Act
      useProfileStore.getState().setActiveProfile(nonExistentId);
      const state = useProfileStore.getState();

      // Assert
      expect(state.activeProfileId).toBe(nonExistentId);
    });
  });

  describe("updatePowerZones", () => {
    it("should update power zones for a profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Cyclist");
      const originalUpdatedAt = profile.updatedAt;
      const newZones: Array<PowerZone> = [
        { zone: 1, name: "Z1", minPercent: 0, maxPercent: 50 },
        { zone: 2, name: "Z2", minPercent: 51, maxPercent: 70 },
        { zone: 3, name: "Z3", minPercent: 71, maxPercent: 85 },
        { zone: 4, name: "Z4", minPercent: 86, maxPercent: 100 },
        { zone: 5, name: "Z5", minPercent: 101, maxPercent: 115 },
        { zone: 6, name: "Z6", minPercent: 116, maxPercent: 140 },
        { zone: 7, name: "Z7", minPercent: 141, maxPercent: 200 },
      ];

      // Act
      useProfileStore.getState().updatePowerZones(profile.id, newZones);
      const state = useProfileStore.getState();

      // Assert
      const updatedProfile = state.profiles[0];
      expect(updatedProfile.powerZones).toEqual(newZones);
      expect(updatedProfile.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it("should do nothing when profile ID does not exist", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Athlete");
      const originalZones = profile.powerZones;
      const nonExistentId = "non-existent-id";
      const newZones: Array<PowerZone> = [
        { zone: 1, name: "Z1", minPercent: 0, maxPercent: 50 },
        { zone: 2, name: "Z2", minPercent: 51, maxPercent: 70 },
        { zone: 3, name: "Z3", minPercent: 71, maxPercent: 85 },
        { zone: 4, name: "Z4", minPercent: 86, maxPercent: 100 },
        { zone: 5, name: "Z5", minPercent: 101, maxPercent: 115 },
        { zone: 6, name: "Z6", minPercent: 116, maxPercent: 140 },
        { zone: 7, name: "Z7", minPercent: 141, maxPercent: 200 },
      ];

      // Act
      useProfileStore.getState().updatePowerZones(nonExistentId, newZones);
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles[0].powerZones).toEqual(originalZones);
    });
  });

  describe("updateHeartRateZones", () => {
    it("should update heart rate zones for a profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Runner");
      const originalUpdatedAt = profile.updatedAt;
      const newZones: Array<HeartRateZone> = [
        { zone: 1, name: "Z1", minBpm: 100, maxBpm: 120 },
        { zone: 2, name: "Z2", minBpm: 121, maxBpm: 140 },
        { zone: 3, name: "Z3", minBpm: 141, maxBpm: 160 },
        { zone: 4, name: "Z4", minBpm: 161, maxBpm: 175 },
        { zone: 5, name: "Z5", minBpm: 176, maxBpm: 190 },
      ];

      // Act
      useProfileStore.getState().updateHeartRateZones(profile.id, newZones);
      const state = useProfileStore.getState();

      // Assert
      const updatedProfile = state.profiles[0];
      expect(updatedProfile.heartRateZones).toEqual(newZones);
      expect(updatedProfile.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it("should do nothing when profile ID does not exist", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Athlete");
      const originalZones = profile.heartRateZones;
      const nonExistentId = "non-existent-id";
      const newZones: Array<HeartRateZone> = [
        { zone: 1, name: "Z1", minBpm: 100, maxBpm: 120 },
        { zone: 2, name: "Z2", minBpm: 121, maxBpm: 140 },
        { zone: 3, name: "Z3", minBpm: 141, maxBpm: 160 },
        { zone: 4, name: "Z4", minBpm: 161, maxBpm: 175 },
        { zone: 5, name: "Z5", minBpm: 176, maxBpm: 190 },
      ];

      // Act
      useProfileStore.getState().updateHeartRateZones(nonExistentId, newZones);
      const state = useProfileStore.getState();

      // Assert
      expect(state.profiles[0].heartRateZones).toEqual(originalZones);
    });
  });

  describe("getActiveProfile", () => {
    it("should return null when no active profile", () => {
      // Arrange & Act
      const activeProfile = useProfileStore.getState().getActiveProfile();

      // Assert
      expect(activeProfile).toBeNull();
    });

    it("should return active profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Active");

      // Act
      const activeProfile = useProfileStore.getState().getActiveProfile();

      // Assert
      expect(activeProfile).toEqual(profile);
    });

    it("should return null when active profile ID does not exist", () => {
      // Arrange
      useProfileStore.getState().createProfile("Profile");
      useProfileStore.getState().setActiveProfile("non-existent-id");

      // Act
      const activeProfile = useProfileStore.getState().getActiveProfile();

      // Assert
      expect(activeProfile).toBeNull();
    });

    it("should return updated profile after changes", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Athlete");
      useProfileStore.getState().updateProfile(profile.id, { ftp: 300 });

      // Act
      const activeProfile = useProfileStore.getState().getActiveProfile();

      // Assert
      expect(activeProfile?.ftp).toBe(300);
    });
  });

  describe("getProfile", () => {
    it("should return profile by ID", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");

      // Act
      const foundProfile = useProfileStore.getState().getProfile(profile.id);

      // Assert
      expect(foundProfile).toEqual(profile);
    });

    it("should return null when profile ID does not exist", () => {
      // Arrange
      useProfileStore.getState().createProfile("Profile");

      // Act
      const foundProfile = useProfileStore
        .getState()
        .getProfile("non-existent-id");

      // Assert
      expect(foundProfile).toBeNull();
    });

    it("should return correct profile when multiple profiles exist", () => {
      // Arrange
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");

      // Act
      const foundProfile = useProfileStore.getState().getProfile(profile2.id);

      // Assert
      expect(foundProfile).toEqual(profile2);
      expect(foundProfile?.id).not.toBe(profile1.id);
    });
  });

  describe("persistence", () => {
    it("should save profiles to localStorage when creating a profile", () => {
      // Arrange
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      // Act
      useProfileStore.getState().createProfile("Test Profile");

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when updating a profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      // Act
      useProfileStore.getState().updateProfile(profile.id, { ftp: 300 });

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when deleting a profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      // Act
      useProfileStore.getState().deleteProfile(profile.id);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when setting active profile", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      // Act
      useProfileStore.getState().setActiveProfile(profile.id);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when updating power zones", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");
      const newZones: Array<PowerZone> = [
        { zone: 1, name: "Z1", minPercent: 0, maxPercent: 50 },
        { zone: 2, name: "Z2", minPercent: 51, maxPercent: 70 },
        { zone: 3, name: "Z3", minPercent: 71, maxPercent: 85 },
        { zone: 4, name: "Z4", minPercent: 86, maxPercent: 100 },
        { zone: 5, name: "Z5", minPercent: 101, maxPercent: 115 },
        { zone: 6, name: "Z6", minPercent: 116, maxPercent: 140 },
        { zone: 7, name: "Z7", minPercent: 141, maxPercent: 200 },
      ];

      // Act
      useProfileStore.getState().updatePowerZones(profile.id, newZones);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when updating heart rate zones", () => {
      // Arrange
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");
      const newZones: Array<HeartRateZone> = [
        { zone: 1, name: "Z1", minBpm: 100, maxBpm: 120 },
        { zone: 2, name: "Z2", minBpm: 121, maxBpm: 140 },
        { zone: 3, name: "Z3", minBpm: 141, maxBpm: 160 },
        { zone: 4, name: "Z4", minBpm: 161, maxBpm: 175 },
        { zone: 5, name: "Z5", minBpm: 176, maxBpm: 190 },
      ];

      // Act
      useProfileStore.getState().updateHeartRateZones(profile.id, newZones);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should handle storage quota errors gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(profileStorage, "saveProfiles").mockReturnValue({
        type: "quota_exceeded",
        message: "Storage quota exceeded",
      });

      // Act
      useProfileStore.getState().createProfile("Test");

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save profiles:",
        "Storage quota exceeded"
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
