/**
 * Save Workout Tests
 *
 * Tests for workout save functionality with validation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupDownloadMock } from "../test-utils/mock-download";
import type { KRD } from "../types/krd";
import { formatSaveErrors, saveWorkout } from "./save-workout";

const FILENAME_MAX_LENGTH = 54; // 50 stem + ".krd"

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("save-workout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveWorkout", () => {
    it("should save valid workout successfully", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      const { anchor, appendChildSpy, removeChildSpy } = setupDownloadMock();

      // Act
      const result = saveWorkout(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filename).toBe("test_workout.krd");
      }
      expect(anchor.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it("should use custom filename when provided", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      setupDownloadMock();

      // Act
      const result = saveWorkout(mockKrd, "custom-name.krd");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filename).toBe("custom-name.krd");
      }
    });

    it("should sanitize workout name for filename", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "My Awesome Workout! @#$%",
            sport: "running",
            steps: [],
          },
        },
      };

      setupDownloadMock();

      // Act
      const result = saveWorkout(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filename).toBe("my_awesome_workout.krd");
      }
    });

    it("should use default filename when workout has no name", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          structured_workout: {
            sport: "swimming",
            steps: [],
          },
        },
      };

      setupDownloadMock();

      // Act
      const result = saveWorkout(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filename).toBe("workout.krd");
      }
    });

    it("should return validation errors for invalid KRD", () => {
      // Arrange
      const invalidKrd = {
        version: "1.0",
        // Missing required 'type' field
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      } as unknown as KRD;

      // Act
      const result = saveWorkout(invalidKrd);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].path).toContain("type");
      }
    });

    it("should return validation errors for missing metadata", () => {
      // Arrange
      const invalidKrd = {
        version: "1.0",
        type: "structured_workout",
        // Missing required metadata
      } as unknown as KRD;

      // Act
      const result = saveWorkout(invalidKrd);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("should limit filename length to 50 characters", () => {
      // Arrange
      const longName = "a".repeat(100);
      const mockKrd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: longName,
            sport: "cycling",
            steps: [],
          },
        },
      };

      setupDownloadMock();

      // Act
      const result = saveWorkout(mockKrd);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filename.length).toBeLessThanOrEqual(FILENAME_MAX_LENGTH);
      }
    });
  });

  describe("formatSaveErrors", () => {
    it("should format single error", () => {
      // Arrange
      const errors = [{ path: ["type"], message: "Required field" }];

      // Act
      const result = formatSaveErrors(errors);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("type: Required field");
    });

    it("should format multiple errors", () => {
      // Arrange
      const errors = [
        { path: ["type"], message: "Required field" },
        { path: ["metadata", "sport"], message: "Invalid sport" },
      ];

      // Act
      const result = formatSaveErrors(errors);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBe("type: Required field");
      expect(result[1]).toBe("metadata.sport: Invalid sport");
    });

    it("should handle empty path", () => {
      // Arrange
      const errors = [{ path: [], message: "General error" }];

      // Act
      const result = formatSaveErrors(errors);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("workout: General error");
    });

    it("should handle nested paths", () => {
      // Arrange
      const errors = [
        {
          path: ["extensions", "structured_workout", "steps", 0, "duration"],
          message: "Invalid duration",
        },
      ];

      // Act
      const result = formatSaveErrors(errors);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(
        "extensions.structured_workout.steps.0.duration: Invalid duration"
      );
    });
  });
});
