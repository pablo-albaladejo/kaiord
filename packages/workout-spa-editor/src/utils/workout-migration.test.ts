import { describe, expect, it } from "vitest";
import type { RepetitionBlock, Workout } from "../types/krd";
import { migrateRepetitionBlocks } from "./workout-migration";

describe("migrateRepetitionBlocks", () => {
  describe("migrating blocks without IDs", () => {
    it("should add IDs to blocks that don't have them", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      const block = result.steps[0] as RepetitionBlock;
      expect(block.id).toBeDefined();
      expect(typeof block.id).toBe("string");
      expect(block.id).toMatch(/^block-\d+-[a-z0-9]+$/);
    });

    it("should add unique IDs to multiple blocks without IDs", () => {
      // Arrange
      const workout: Workout = {
        sport: "cycling",
        steps: [
          {
            repeatCount: 2,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 360 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 210 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      const block1 = result.steps[0] as RepetitionBlock;
      const block2 = result.steps[1] as RepetitionBlock;
      expect(block1.id).toBeDefined();
      expect(block2.id).toBeDefined();
      expect(block1.id).not.toBe(block2.id);
    });
  });

  describe("preserving blocks with IDs", () => {
    it("should preserve existing IDs if present", () => {
      // Arrange
      const existingId = "block-1234567890-abc123";
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            id: existingId,
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      const block = result.steps[0] as RepetitionBlock;
      expect(block.id).toBe(existingId);
    });

    it("should not modify blocks that already have IDs", () => {
      // Arrange
      const existingId1 = "block-1111111111-aaa111";
      const existingId2 = "block-2222222222-bbb222";
      const workout: Workout = {
        sport: "cycling",
        steps: [
          {
            id: existingId1,
            repeatCount: 2,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
          {
            id: existingId2,
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 360 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 210 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      const block1 = result.steps[0] as RepetitionBlock;
      const block2 = result.steps[1] as RepetitionBlock;
      expect(block1.id).toBe(existingId1);
      expect(block2.id).toBe(existingId2);
    });
  });

  describe("mixed scenarios", () => {
    it("should handle mix of blocks with and without IDs", () => {
      // Arrange
      const existingId = "block-1234567890-abc123";
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            id: existingId,
            repeatCount: 2,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 360 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 210 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      const block1 = result.steps[0] as RepetitionBlock;
      const block2 = result.steps[1] as RepetitionBlock;
      expect(block1.id).toBe(existingId);
      expect(block2.id).toBeDefined();
      expect(block2.id).not.toBe(existingId);
    });

    it("should handle workout with steps and blocks mixed", () => {
      // Arrange
      const workout: Workout = {
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 150 },
            },
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 100 },
            },
          },
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      expect(result.steps).toHaveLength(3);
      const block = result.steps[1] as RepetitionBlock;
      expect(block.id).toBeDefined();
      expect(typeof block.id).toBe("string");
    });
  });

  describe("empty workouts", () => {
    it("should handle workout with no steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      expect(result.steps).toHaveLength(0);
    });

    it("should handle workout with only individual steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 150 },
            },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]).toEqual(workout.steps[0]);
      expect(result.steps[1]).toEqual(workout.steps[1]);
    });
  });

  describe("immutability", () => {
    it("should not modify the original workout", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };
      const originalBlock = workout.steps[0] as RepetitionBlock;

      // Act
      migrateRepetitionBlocks(workout);

      // Assert
      expect(originalBlock.id).toBeUndefined();
    });

    it("should return a new workout object", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 200 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = migrateRepetitionBlocks(workout);

      // Assert
      expect(result).not.toBe(workout);
      expect(result.steps).not.toBe(workout.steps);
    });
  });
});
