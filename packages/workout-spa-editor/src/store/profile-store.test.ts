/**
 * Profile Store Tests
 *
 * Tests for the profile store implementation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProfileStore } from "./profile-store";

describe("useProfileStore", () => {
  beforeEach(() => {
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
      const profile = useProfileStore.getState().createProfile("Test Athlete");
      const state = useProfileStore.getState();

      expect(state.profiles).toHaveLength(1);
      expect(profile.name).toBe("Test Athlete");
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

    it("should not change active when creating second profile", () => {
      const profile1 = useProfileStore.getState().createProfile("Profile 1");
      useProfileStore.getState().createProfile("Profile 2");
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(profile1.id);
      expect(state.profiles).toHaveLength(2);
    });

    it("should generate unique IDs for each profile", () => {
      const p1 = useProfileStore.getState().createProfile("Profile 1");
      const p2 = useProfileStore.getState().createProfile("Profile 2");

      expect(p1.id).not.toBe(p2.id);
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

      expect(useProfileStore.getState().profiles[0].bodyWeight).toBe(72);
    });

    it("should do nothing when profile ID does not exist", () => {
      const profile = useProfileStore.getState().createProfile("Athlete");

      useProfileStore
        .getState()
        .updateProfile("non-existent-id", { name: "New" });

      expect(useProfileStore.getState().profiles[0].name).toBe(profile.name);
    });
  });

  describe("deleteProfile", () => {
    it("should remove profile from store", () => {
      const profile = useProfileStore.getState().createProfile("To Delete");

      useProfileStore.getState().deleteProfile(profile.id);

      expect(useProfileStore.getState().profiles).toHaveLength(0);
    });

    it("should set activeProfileId to null when deleting only profile", () => {
      const profile = useProfileStore.getState().createProfile("Only Profile");

      useProfileStore.getState().deleteProfile(profile.id);

      expect(useProfileStore.getState().activeProfileId).toBeNull();
    });

    it("should reassign active to first remaining when deleting active", () => {
      const p1 = useProfileStore.getState().createProfile("Profile 1");
      const p2 = useProfileStore.getState().createProfile("Profile 2");
      useProfileStore.getState().setActiveProfile(p1.id);

      useProfileStore.getState().deleteProfile(p1.id);
      const state = useProfileStore.getState();

      expect(state.activeProfileId).toBe(p2.id);
      expect(state.profiles).toHaveLength(1);
    });
  });

  describe("setActiveProfile", () => {
    it("should set active profile by ID", () => {
      useProfileStore.getState().createProfile("Profile 1");
      const p2 = useProfileStore.getState().createProfile("Profile 2");

      useProfileStore.getState().setActiveProfile(p2.id);

      expect(useProfileStore.getState().activeProfileId).toBe(p2.id);
    });
  });

  describe("getActiveProfile", () => {
    it("should return null when no active profile", () => {
      expect(useProfileStore.getState().getActiveProfile()).toBeNull();
    });

    it("should return active profile", () => {
      const profile = useProfileStore.getState().createProfile("Active");

      expect(useProfileStore.getState().getActiveProfile()).toEqual(profile);
    });
  });

  describe("getProfile", () => {
    it("should return profile by ID", () => {
      const profile = useProfileStore.getState().createProfile("Test");

      expect(useProfileStore.getState().getProfile(profile.id)).toEqual(
        profile
      );
    });

    it("should return null when profile ID does not exist", () => {
      useProfileStore.getState().createProfile("Profile");

      expect(
        useProfileStore.getState().getProfile("non-existent-id")
      ).toBeNull();
    });
  });
});
