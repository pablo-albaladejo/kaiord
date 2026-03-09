/**
 * Profile Store Tests
 *
 * Tests for the Zustand profile store implementation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as profileStorage from "../utils/profile-storage";
import { useProfileStore } from "./profile-store";

describe("useProfileStore", () => {
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
      const state = useProfileStore.getState();

      expect(state.profiles).toEqual([]);
    });

    it("should have null activeProfileId initially", () => {
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBeNull();
    });
  });

  describe("createProfile", () => {
    it("should create a profile with name only", () => {
      const name = "Test Athlete";

      const profile = useProfileStore.getState().createProfile(name);
      const state = useProfileStore.getState();

      expect(state.profiles).toHaveLength(1);
      expect(profile.name).toBe(name);
      expect(profile.id).toBeDefined();
      expect(profile.bodyWeight).toBeUndefined();
      expect(profile.sportZones).toBeDefined();
      expect(profile.sportZones.cycling).toBeDefined();
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it("should create a profile with body weight", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { bodyWeight: 70 });

      expect(profile.bodyWeight).toBe(70);
    });

    it("should set first profile as active", () => {
      const profile = useProfileStore.getState().createProfile("First Profile");
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile.id);
    });

    it("should not change active profile when creating second profile", () => {
      const profile1 = useProfileStore.getState().createProfile("Profile 1");

      useProfileStore.getState().createProfile("Profile 2");
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile1.id);
      expect(state.profiles).toHaveLength(2);
    });

    it("should generate unique IDs for each profile", () => {
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");

      expect(profile1.id).not.toBe(profile2.id);
    });

    it("should initialize sportZones with all 4 sports", () => {
      const profile = useProfileStore.getState().createProfile("Cyclist");

      expect(profile.sportZones.cycling).toBeDefined();
      expect(profile.sportZones.running).toBeDefined();
      expect(profile.sportZones.swimming).toBeDefined();
      expect(profile.sportZones.generic).toBeDefined();
    });

    it("should have power zones in cycling sportZones", () => {
      const profile = useProfileStore.getState().createProfile("Cyclist");
      const cycling = profile.sportZones.cycling;

      expect(cycling?.powerZones).toBeDefined();
      expect(cycling?.powerZones?.zones).toHaveLength(7);
      expect(cycling?.powerZones?.zones[0]?.name).toBe("Active Recovery");
    });
  });

  describe("updateProfile", () => {
    it("should update profile name", () => {
      const profile = useProfileStore.getState().createProfile("Old Name");
      const originalUpdatedAt = profile.updatedAt;

      useProfileStore
        .getState()
        .updateProfile(profile.id, { name: "New Name" });
      const state = useProfileStore.getState();

      const updated = state.profiles[0];
      expect(updated.name).toBe("New Name");
      expect(updated.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it("should update body weight", () => {
      const profile = useProfileStore
        .getState()
        .createProfile("Athlete", { bodyWeight: 70 });

      useProfileStore.getState().updateProfile(profile.id, { bodyWeight: 72 });
      const state = useProfileStore.getState();

      expect(state.profiles[0].bodyWeight).toBe(72);
    });

    it("should do nothing when profile ID does not exist", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");

      useProfileStore
        .getState()
        .updateProfile("non-existent-id", { name: "New" });
      const state = useProfileStore.getState();

      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].name).toBe(profile.name);
    });
  });

  describe("deleteProfile", () => {
    it("should remove profile from store", () => {
      const profile = useProfileStore.getState().createProfile("To Delete");

      useProfileStore.getState().deleteProfile(profile.id);
      const state = useProfileStore.getState();

      expect(state.profiles).toHaveLength(0);
    });

    it("should set activeProfileId to null when deleting the only profile", () => {
      const profile = useProfileStore.getState().createProfile("Only Profile");

      useProfileStore.getState().deleteProfile(profile.id);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBeNull();
    });

    it("should set activeProfileId to first remaining profile when deleting active", () => {
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");
      useProfileStore.getState().setActiveProfile(profile1.id);

      useProfileStore.getState().deleteProfile(profile1.id);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile2.id);
      expect(state.profiles).toHaveLength(1);
    });

    it("should preserve activeProfileId when deleting non-active profile", () => {
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");
      useProfileStore.getState().setActiveProfile(profile1.id);

      useProfileStore.getState().deleteProfile(profile2.id);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile1.id);
      expect(state.profiles).toHaveLength(1);
    });
  });

  describe("setActiveProfile", () => {
    it("should set active profile by ID", () => {
      useProfileStore.getState().createProfile("Profile 1");
      const profile2 = useProfileStore.getState().createProfile("Profile 2");

      useProfileStore.getState().setActiveProfile(profile2.id);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile2.id);
    });

    it("should allow setting activeProfileId to null", () => {
      useProfileStore.getState().createProfile("Profile");

      useProfileStore.getState().setActiveProfile(null);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBeNull();
    });
  });

  describe("getActiveProfile", () => {
    it("should return null when no active profile", () => {
      const activeProfile = useProfileStore.getState().getActiveProfile();

      expect(activeProfile).toBeNull();
    });

    it("should return active profile", () => {
      const profile = useProfileStore.getState().createProfile("Active");

      const activeProfile = useProfileStore.getState().getActiveProfile();

      expect(activeProfile).toEqual(profile);
    });

    it("should return null when active profile ID does not exist", () => {
      useProfileStore.getState().createProfile("Profile");
      useProfileStore.getState().setActiveProfile("non-existent-id");

      const activeProfile = useProfileStore.getState().getActiveProfile();

      expect(activeProfile).toBeNull();
    });
  });

  describe("getProfile", () => {
    it("should return profile by ID", () => {
      const profile = useProfileStore.getState().createProfile("Test");

      const foundProfile = useProfileStore.getState().getProfile(profile.id);

      expect(foundProfile).toEqual(profile);
    });

    it("should return null when profile ID does not exist", () => {
      useProfileStore.getState().createProfile("Profile");

      const foundProfile = useProfileStore
        .getState()
        .getProfile("non-existent-id");

      expect(foundProfile).toBeNull();
    });
  });

  describe("persistence", () => {
    it("should save profiles to localStorage when creating a profile", () => {
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      useProfileStore.getState().createProfile("Test Profile");

      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when updating a profile", () => {
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      useProfileStore.getState().updateProfile(profile.id, { name: "Updated" });

      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when deleting a profile", () => {
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      useProfileStore.getState().deleteProfile(profile.id);

      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save profiles to localStorage when setting active profile", () => {
      const profile = useProfileStore.getState().createProfile("Test");
      const saveSpy = vi.spyOn(profileStorage, "saveProfiles");

      useProfileStore.getState().setActiveProfile(profile.id);

      expect(saveSpy).toHaveBeenCalled();
    });

    it("should handle storage quota errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(profileStorage, "saveProfiles").mockReturnValue({
        type: "quota_exceeded",
        message: "Storage quota exceeded",
      });

      useProfileStore.getState().createProfile("Test");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save profiles:",
        "Storage quota exceeded"
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
