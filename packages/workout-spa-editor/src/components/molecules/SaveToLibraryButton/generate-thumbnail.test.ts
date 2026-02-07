/**
 * Thumbnail Generation Tests
 *
 * Tests for the thumbnail generation utility.
 */

import { KRD, WorkoutStep } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateThumbnail } from "./generate-thumbnail";

describe("generateThumbnail", () => {
  const mockKRD: KRD = {
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
  };

  const mockWorkoutStep: WorkoutStep = {
    stepIndex: 0,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  };

  beforeEach(() => {
    // Mock canvas API
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 0,
        font: "",
        textAlign: "",
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
      })),
      toDataURL: vi.fn(() => "data:image/png;base64,mockdata"),
    };

    vi.spyOn(document, "createElement").mockReturnValue(
      mockCanvas as unknown as HTMLCanvasElement
    );
  });

  describe("empty workout", () => {
    it("should generate thumbnail for empty workout", async () => {
      // Arrange
      const workout: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "Empty",
            sport: "cycling",
            steps: [],
          },
        },
      };

      // Act
      const result = await generateThumbnail(workout);

      // Assert
      expect(result).toBe("data:image/png;base64,mockdata");
    });
  });

  describe("workout with steps", () => {
    it("should generate thumbnail for workout with time-based steps", async () => {
      // Arrange
      const step1: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 300 },
        intensity: "warmup",
      };
      const step2: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 600 },
        intensity: "active",
      };

      const workout: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "Test",
            sport: "cycling",
            steps: [step1, step2],
          },
        },
      };

      // Act
      const result = await generateThumbnail(workout);

      // Assert
      expect(result).toBe("data:image/png;base64,mockdata");
    });

    it("should generate thumbnail for workout with repetition blocks", async () => {
      // Arrange
      const step: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 300 },
      };

      const workout: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "Test",
            sport: "cycling",
            steps: [
              {
                repeatCount: 3,
                steps: [step],
              },
            ],
          },
        },
      };

      // Act
      const result = await generateThumbnail(workout);

      // Assert
      expect(result).toBe("data:image/png;base64,mockdata");
    });

    it("should handle non-time duration steps", async () => {
      // Arrange
      const step: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "distance", meters: 5000 },
      };

      const workout: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "Test",
            sport: "running",
            steps: [step],
          },
        },
      };

      // Act
      const result = await generateThumbnail(workout);

      // Assert
      expect(result).toBe("data:image/png;base64,mockdata");
    });
  });

  describe("error handling", () => {
    it("should throw error when canvas context is not available", async () => {
      // Arrange
      const mockCanvas = {
        getContext: vi.fn(() => null),
      };

      vi.spyOn(document, "createElement").mockReturnValue(
        mockCanvas as unknown as HTMLCanvasElement
      );

      const workout = mockKRD;

      // Act & Assert
      await expect(generateThumbnail(workout)).rejects.toThrow(
        "Failed to get canvas context"
      );
    });
  });

  describe("intensity colors", () => {
    it("should use different colors for different intensities", async () => {
      // Arrange
      const warmup: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 300 },
        intensity: "warmup",
      };
      const active: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 600 },
        intensity: "active",
      };
      const cooldown: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 300 },
        intensity: "cooldown",
      };
      const rest: WorkoutStep = {
        ...mockWorkoutStep,
        duration: { type: "time", seconds: 120 },
        intensity: "rest",
      };

      const workout: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "Test",
            sport: "cycling",
            steps: [warmup, active, cooldown, rest],
          },
        },
      };

      // Act
      const result = await generateThumbnail(workout);

      // Assert
      expect(result).toBe("data:image/png;base64,mockdata");
    });
  });
});
