/**
 * Library Storage Tests
 *
 * Tests for localStorage persistence of workout library.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutTemplate } from "../types/workout-library";
import { clearLibrary, loadLibrary, saveLibrary } from "./library-storage";

describe("library-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("saveLibrary", () => {
    it("should save templates to localStorage", () => {
      // Arrange
      // Arrange

      const templates: Array<WorkoutTemplate> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Workout",
          sport: "cycling",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T10:30:00Z",
              sport: "cycling",
            },
            extensions: {
              structured_workout: {
                name: "Test Workout",
                sport: "cycling",
                steps: [],
              },
            },
          },
          tags: ["test", "easy"],
          difficulty: "easy",
          duration: 3600,
          notes: "Test notes",
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-15T10:30:00Z",
        },
      ];

      // Act

      // Act

      const error = saveLibrary(templates);

      // Assert

      // Assert

      expect(error).toBeNull();
      const stored = localStorage.getItem("workout-spa-library");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.templates).toHaveLength(1);
      expect(parsed.templates[0].name).toBe("Test Workout");
    });

    it("should save empty templates array", () => {
      // Arrange
      // Arrange

      const templates: Array<WorkoutTemplate> = [];

      // Act

      // Act

      const error = saveLibrary(templates);

      // Assert

      // Assert

      expect(error).toBeNull();
      const stored = localStorage.getItem("workout-spa-library");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.templates).toHaveLength(0);
    });

    it("should handle quota exceeded error", () => {
      // Arrange
      // Arrange

      const templates: Array<WorkoutTemplate> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Workout",
          sport: "cycling",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T10:30:00Z",
              sport: "cycling",
            },
            extensions: {
              structured_workout: {
                name: "Test Workout",
                sport: "cycling",
                steps: [],
              },
            },
          },
          tags: [],
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-15T10:30:00Z",
        },
      ];

      const quotaError = new Error("Quota exceeded");
      quotaError.name = "QuotaExceededError";

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      // Act

      // Act

      const error = saveLibrary(templates);

      // Assert

      // Assert

      expect(error).not.toBeNull();
      expect(error?.type).toBe("quota_exceeded");
      expect(error?.message).toContain("Storage quota exceeded");
    });

    it("should handle unknown errors", () => {
      // Arrange
      // Arrange

      const templates: Array<WorkoutTemplate> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Workout",
          sport: "cycling",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T10:30:00Z",
              sport: "cycling",
            },
            extensions: {
              structured_workout: {
                name: "Test Workout",
                sport: "cycling",
                steps: [],
              },
            },
          },
          tags: [],
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-15T10:30:00Z",
        },
      ];

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Unknown error");
      });

      // Act

      // Act

      const error = saveLibrary(templates);

      // Assert

      // Assert

      expect(error).not.toBeNull();
      expect(error?.type).toBe("unknown_error");
      expect(error?.message).toBe("Unknown error");
    });
  });

  describe("loadLibrary", () => {
    it("should load templates from localStorage", () => {
      // Arrange
      // Arrange

      const state = {
        templates: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test Workout",
            sport: "cycling",
            krd: {
              version: "1.0",
              type: "structured_workout",
              metadata: {
                created: "2025-01-15T10:30:00Z",
                sport: "cycling",
              },
              extensions: {
                structured_workout: {
                  name: "Test Workout",
                  sport: "cycling",
                  steps: [],
                },
              },
            },
            tags: ["test"],
            difficulty: "easy",
            duration: 3600,
            createdAt: "2025-01-15T10:30:00Z",
            updatedAt: "2025-01-15T10:30:00Z",
          },
        ],
      };

      localStorage.setItem("workout-spa-library", JSON.stringify(state));

      // Act

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.templates).toHaveLength(1);
        expect(result.data.templates[0].name).toBe("Test Workout");
        expect(result.data.templates[0].sport).toBe("cycling");
      }
    });

    it("should return empty templates when no data exists", () => {
      // Arrange
      // localStorage is empty

      // Act
      // Arrange

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.templates).toHaveLength(0);
      }
    });

    it("should handle invalid JSON", () => {
      // Arrange
      // Arrange

      localStorage.setItem("workout-spa-library", "invalid json");

      // Act

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("parse_error");
      }
    });

    it("should handle invalid schema", () => {
      // Arrange
      // Arrange

      const invalidState = {
        templates: [
          {
            id: "not-a-uuid",
            name: "",
            // Missing required fields
          },
        ],
      };

      localStorage.setItem("workout-spa-library", JSON.stringify(invalidState));

      // Act

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("parse_error");
        expect(result.error.message).toContain("Invalid library data");
      }
    });

    it("should handle missing templates field", () => {
      // Arrange
      // Arrange

      const invalidState = {
        // Missing templates field
      };

      localStorage.setItem("workout-spa-library", JSON.stringify(invalidState));

      // Act

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("parse_error");
      }
    });
  });

  describe("clearLibrary", () => {
    it("should remove library from localStorage", () => {
      // Arrange
      // Arrange

      const state = {
        templates: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test Workout",
            sport: "cycling",
            krd: {
              version: "1.0",
              type: "structured_workout",
              metadata: {
                created: "2025-01-15T10:30:00Z",
                sport: "cycling",
              },
              extensions: {
                structured_workout: {
                  name: "Test Workout",
                  sport: "cycling",
                  steps: [],
                },
              },
            },
            tags: [],
            createdAt: "2025-01-15T10:30:00Z",
            updatedAt: "2025-01-15T10:30:00Z",
          },
        ],
      };

      localStorage.setItem("workout-spa-library", JSON.stringify(state));

      // Act
      clearLibrary();

      // Assert

      // Act

      const stored = localStorage.getItem("workout-spa-library");

      // Assert

      expect(stored).toBeNull();
    });

    it("should not throw when clearing empty storage", () => {
      // Arrange
      // localStorage is empty

      // Act & Assert
      // Arrange

      // Act

      // Assert
      expect(() => clearLibrary()).not.toThrow();
    });
  });

  describe("integration", () => {
    it("should save and load templates correctly", () => {
      // Arrange
      // Arrange

      const templates: Array<WorkoutTemplate> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Morning Ride",
          sport: "cycling",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T10:30:00Z",
              sport: "cycling",
            },
            extensions: {
              structured_workout: {
                name: "Morning Ride",
                sport: "cycling",
                steps: [],
              },
            },
          },
          tags: ["morning", "easy"],
          difficulty: "easy",
          duration: 3600,
          notes: "Easy morning ride",
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-15T10:30:00Z",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Interval Training",
          sport: "running",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T11:00:00Z",
              sport: "running",
            },
            extensions: {
              structured_workout: {
                name: "Interval Training",
                sport: "running",
                steps: [],
              },
            },
          },
          tags: ["intervals", "hard"],
          difficulty: "hard",
          duration: 2700,
          createdAt: "2025-01-15T11:00:00Z",
          updatedAt: "2025-01-15T11:00:00Z",
        },
      ];

      // Act
      const saveError = saveLibrary(templates);

      // Act

      const loadResult = loadLibrary();

      // Assert

      // Assert

      expect(saveError).toBeNull();
      expect(loadResult.success).toBe(true);

      if (loadResult.success) {
        expect(loadResult.data.templates).toHaveLength(2);
        expect(loadResult.data.templates[0].name).toBe("Morning Ride");
        expect(loadResult.data.templates[1].name).toBe("Interval Training");
      }
    });

    it("should handle multiple save operations", () => {
      // Arrange
      // Arrange

      const templates1: Array<WorkoutTemplate> = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Workout 1",
          sport: "cycling",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T10:30:00Z",
              sport: "cycling",
            },
            extensions: {
              structured_workout: {
                name: "Workout 1",
                sport: "cycling",
                steps: [],
              },
            },
          },
          tags: [],
          createdAt: "2025-01-15T10:30:00Z",
          updatedAt: "2025-01-15T10:30:00Z",
        },
      ];

      const templates2: Array<WorkoutTemplate> = [
        ...templates1,
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Workout 2",
          sport: "running",
          krd: {
            version: "1.0",
            type: "structured_workout",
            metadata: {
              created: "2025-01-15T11:00:00Z",
              sport: "running",
            },
            extensions: {
              structured_workout: {
                name: "Workout 2",
                sport: "running",
                steps: [],
              },
            },
          },
          tags: [],
          createdAt: "2025-01-15T11:00:00Z",
          updatedAt: "2025-01-15T11:00:00Z",
        },
      ];

      // Act
      saveLibrary(templates1);
      saveLibrary(templates2);

      // Act

      const result = loadLibrary();

      // Assert

      // Assert

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.templates).toHaveLength(2);
      }
    });
  });
});
