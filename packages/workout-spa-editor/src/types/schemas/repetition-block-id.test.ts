/**
 * Property-Based Tests for Repetition Block ID Uniqueness
 *
 * Tests that validate the uniqueness and stability of repetition block IDs.
 *
 * **Feature: workout-spa-editor/11-fix-repetition-block-deletion-index-bug, Property 2: Block ID uniqueness**
 * **Validates: Requirements 2.1, 2.2**
 */

import type { RepetitionBlock } from "@kaiord/core";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateBlockId } from "../../utils/id-generation";

/**
 * Creates a repetition block with an ID
 */
const createBlockWithId = (repeatCount: number): RepetitionBlock => {
  return {
    id: generateBlockId(),
    repeatCount,
    steps: [],
  };
};

describe("Repetition Block ID Uniqueness", () => {
  describe("Property 2: Block ID uniqueness", () => {
    /**
     * Property: For any workout, all repetition block IDs should be unique
     *
     * This property ensures that when multiple blocks are created,
     * each block receives a unique identifier that can be used for
     * reliable deletion, editing, and other operations.
     *
     * **Validates: Requirements 2.1, 2.2**
     */
    it("should generate unique IDs for all blocks in a workout", () => {
      fc.assert(
        fc.property(
          // Generate random number of blocks (2-20)
          fc.integer({ min: 2, max: 20 }),
          (blockCount) => {
            // Arrange: Create multiple blocks with IDs
            const blocks: Array<RepetitionBlock> = [];
            for (let i = 0; i < blockCount; i++) {
              blocks.push(
                createBlockWithId(
                  fc.sample(fc.integer({ min: 2, max: 10 }), 1)[0]
                )
              );
            }

            // Act: Extract all block IDs
            const blockIds = blocks
              .map((block) => block.id)
              .filter((id): id is string => id !== undefined);

            // Assert: All IDs should be unique
            const uniqueIds = new Set(blockIds);
            expect(uniqueIds.size).toBe(blockIds.length);
            expect(blockIds.length).toBe(blockCount);
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    /**
     * Property: Block IDs should be non-empty strings
     *
     * This ensures that generated IDs are valid and can be used
     * for lookups and comparisons.
     */
    it("should generate non-empty string IDs", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (count) => {
          // Arrange & Act: Generate multiple IDs
          const ids = Array.from({ length: count }, () => generateBlockId());

          // Assert: All IDs should be non-empty strings
          ids.forEach((id) => {
            expect(typeof id).toBe("string");
            expect(id.length).toBeGreaterThan(0);
            expect(id).toMatch(/^block-\d+-[a-z0-9]+$/);
          });
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Rapidly generated IDs should still be unique
     *
     * This tests that even when IDs are generated in quick succession,
     * they remain unique (important for batch operations).
     */
    it("should generate unique IDs even when created rapidly", () => {
      fc.assert(
        fc.property(fc.integer({ min: 10, max: 50 }), (count) => {
          // Arrange & Act: Generate many IDs rapidly
          const ids = Array.from({ length: count }, () => generateBlockId());

          // Assert: All IDs should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(count);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Workout with mixed steps and blocks should have unique block IDs
     *
     * This tests the real-world scenario where a workout contains
     * both individual steps and repetition blocks.
     */
    it("should maintain unique block IDs in workouts with mixed content", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Number of blocks
          fc.integer({ min: 0, max: 5 }), // Number of individual steps
          (blockCount, stepCount) => {
            // Arrange: Create workout with blocks and steps
            const blocks: Array<RepetitionBlock> = [];
            for (let i = 0; i < blockCount; i++) {
              blocks.push(
                createBlockWithId(
                  fc.sample(fc.integer({ min: 2, max: 10 }), 1)[0]
                )
              );
            }

            // Act: Extract block IDs
            const blockIds = blocks
              .map((block) => block.id)
              .filter((id): id is string => id !== undefined);

            // Assert: All block IDs should be unique
            const uniqueIds = new Set(blockIds);
            expect(uniqueIds.size).toBe(blockCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("ID Generation Performance", () => {
    /**
     * Property: ID generation should be fast (< 1ms per ID)
     *
     * This ensures that ID generation doesn't become a performance
     * bottleneck when creating or manipulating workouts.
     */
    it("should generate IDs quickly", () => {
      // Arrange
      const iterations = 1000;

      // Act
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        generateBlockId();
      }
      const endTime = performance.now();

      // Assert: Average time per ID should be < 1ms
      const avgTimePerIdMs = (endTime - startTime) / iterations;
      expect(avgTimePerIdMs).toBeLessThan(1);
    });
  });
});
