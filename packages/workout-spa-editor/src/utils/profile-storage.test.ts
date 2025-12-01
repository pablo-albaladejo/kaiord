/**
 * Profile Storage Tests
 *
 * Unit tests for profile localStorage persistence.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "../types/profile";
import {
  clearProfiles,
  loadProfiles,
  saveProfiles,
  type StorageState,
} from "./profile-storage";

describe("profile-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("saveProfiles", () => {
    it("should save profiles to localStorage", () => {
      // Arrange
      const profiles: Array<Profile> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Profile",
          ftp: 250,
          maxHeartRate: 180,
          powerZones: [
            { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
            { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
            { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
            { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
            { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
            { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
            { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
          ],
          heartRateZones: [
            { zone: 1, name: "HR1", minBpm: 0, maxBpm: 108 },
            { zone: 2, name: "HR2", minBpm: 108, maxBpm: 126 },
            { zone: 3, name: "HR3", minBpm: 126, maxBpm: 144 },
            { zone: 4, name: "HR4", minBpm: 144, maxBpm: 162 },
            { zone: 5, name: "HR5", minBpm: 162, maxBpm: 180 },
          ],
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
        },
      ];
      const activeProfileId = "550e8400-e29b-41d4-a716-446655440000";

      // Act
      const error = saveProfiles(profiles, activeProfileId);

      // Assert
      expect(error).toBeNull();
      const stored = localStorage.getItem("workout-spa-profiles");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.profiles).toHaveLength(1);
      expect(parsed.activeProfileId).toBe(activeProfileId);
    });

    it("should save empty profiles array", () => {
      // Arrange
      const profiles: Array<Profile> = [];
      const activeProfileId = null;

      // Act
      const error = saveProfiles(profiles, activeProfileId);

      // Assert
      expect(error).toBeNull();
      const stored = localStorage.getItem("workout-spa-profiles");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.profiles).toHaveLength(0);
      expect(parsed.activeProfileId).toBeNull();
    });

    it("should handle quota exceeded error", () => {
      // Arrange
      const profiles: Array<Profile> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
          powerZones: [
            { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
            { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
            { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
            { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
            { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
            { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
            { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
          ],
          heartRateZones: [
            { zone: 1, name: "HR1", minBpm: 0, maxBpm: 108 },
            { zone: 2, name: "HR2", minBpm: 108, maxBpm: 126 },
            { zone: 3, name: "HR3", minBpm: 126, maxBpm: 144 },
            { zone: 4, name: "HR4", minBpm: 144, maxBpm: 162 },
            { zone: 5, name: "HR5", minBpm: 162, maxBpm: 180 },
          ],
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
        },
      ];

      const quotaError = new Error("QuotaExceededError");
      quotaError.name = "QuotaExceededError";

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      // Act
      const error = saveProfiles(profiles, null);

      // Assert
      expect(error).not.toBeNull();
      expect(error?.type).toBe("quota_exceeded");
      expect(error?.message).toContain("Storage quota exceeded");
    });

    it("should handle unknown errors", () => {
      // Arrange
      const profiles: Array<Profile> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
          powerZones: [
            { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
            { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
            { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
            { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
            { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
            { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
            { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
          ],
          heartRateZones: [
            { zone: 1, name: "HR1", minBpm: 0, maxBpm: 108 },
            { zone: 2, name: "HR2", minBpm: 108, maxBpm: 126 },
            { zone: 3, name: "HR3", minBpm: 126, maxBpm: 144 },
            { zone: 4, name: "HR4", minBpm: 144, maxBpm: 162 },
            { zone: 5, name: "HR5", minBpm: 162, maxBpm: 180 },
          ],
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
        },
      ];

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Unknown error");
      });

      // Act
      const error = saveProfiles(profiles, null);

      // Assert
      expect(error).not.toBeNull();
      expect(error?.type).toBe("unknown_error");
      expect(error?.message).toBe("Unknown error");
    });
  });

  describe("loadProfiles", () => {
    it("should load profiles from localStorage", () => {
      // Arrange
      const state: StorageState = {
        profiles: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test Profile",
            ftp: 250,
            powerZones: [
              { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
              { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
              { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
              { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
              { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
              { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
              { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
            ],
            heartRateZones: [
              { zone: 1, name: "HR1", minBpm: 0, maxBpm: 108 },
              { zone: 2, name: "HR2", minBpm: 108, maxBpm: 126 },
              { zone: 3, name: "HR3", minBpm: 126, maxBpm: 144 },
              { zone: 4, name: "HR4", minBpm: 144, maxBpm: 162 },
              { zone: 5, name: "HR5", minBpm: 162, maxBpm: 180 },
            ],
            createdAt: "2025-01-15T10:00:00Z",
            updatedAt: "2025-01-15T10:00:00Z",
          },
        ],
        activeProfileId: "550e8400-e29b-41d4-a716-446655440000",
      };

      localStorage.setItem("workout-spa-profiles", JSON.stringify(state));

      // Act
      const result = loadProfiles();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profiles).toHaveLength(1);
        expect(result.data.profiles[0].name).toBe("Test Profile");
        expect(result.data.activeProfileId).toBe(
          "550e8400-e29b-41d4-a716-446655440000"
        );
      }
    });

    it("should return empty state when no data exists", () => {
      // Act
      const result = loadProfiles();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profiles).toHaveLength(0);
        expect(result.data.activeProfileId).toBeNull();
      }
    });

    it("should handle invalid JSON", () => {
      // Arrange
      localStorage.setItem("workout-spa-profiles", "invalid json");

      // Act
      const result = loadProfiles();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("parse_error");
      }
    });

    it("should handle invalid schema", () => {
      // Arrange
      const invalidState = {
        profiles: [{ id: "not-a-uuid", name: "Test" }],
        activeProfileId: null,
      };

      localStorage.setItem(
        "workout-spa-profiles",
        JSON.stringify(invalidState)
      );

      // Act
      const result = loadProfiles();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("parse_error");
        expect(result.error.message).toContain("Invalid profile data");
      }
    });
  });

  describe("clearProfiles", () => {
    it("should clear all profile data from localStorage", () => {
      // Arrange
      localStorage.setItem("workout-spa-profiles", "test data");
      localStorage.setItem("workout-spa-active-profile", "test id");

      // Act
      clearProfiles();

      // Assert
      expect(localStorage.getItem("workout-spa-profiles")).toBeNull();
      expect(localStorage.getItem("workout-spa-active-profile")).toBeNull();
    });

    it("should not throw when storage is already empty", () => {
      // Act & Assert
      expect(() => clearProfiles()).not.toThrow();
    });
  });
});
