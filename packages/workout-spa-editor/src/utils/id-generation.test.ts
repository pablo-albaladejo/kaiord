import { describe, expect, it } from "vitest";
import { generateBlockId } from "./id-generation";

describe("generateBlockId", () => {
  describe("ID format consistency", () => {
    it("should generate ID with correct format", () => {
      // Arrange & Act
      const id = generateBlockId();

      // Assert
      expect(id).toMatch(/^block-\d+-[a-z0-9]+$/);
    });

    it("should start with 'block-' prefix", () => {
      // Arrange & Act
      const id = generateBlockId();

      // Assert
      expect(id).toMatch(/^block-/);
    });

    it("should contain timestamp component", () => {
      // Arrange & Act
      const id = generateBlockId();
      const parts = id.split("-");

      // Assert
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("block");
      expect(Number(parts[1])).toBeGreaterThan(0);
    });

    it("should contain random string component", () => {
      // Arrange & Act
      const id = generateBlockId();
      const parts = id.split("-");

      // Assert
      expect(parts).toHaveLength(3);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe("uniqueness across multiple calls", () => {
    it("should generate unique IDs for consecutive calls", () => {
      // Arrange & Act
      const id1 = generateBlockId();
      const id2 = generateBlockId();
      const id3 = generateBlockId();

      // Assert
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should generate unique IDs across many calls", () => {
      // Arrange
      const count = 100;

      // Act
      const ids = Array.from({ length: count }, () => generateBlockId());
      const uniqueIds = new Set(ids);

      // Assert
      expect(uniqueIds.size).toBe(count);
    });

    it("should generate different random components even with same timestamp", () => {
      // Arrange & Act
      // Generate multiple IDs in quick succession (likely same timestamp)
      const ids = Array.from({ length: 10 }, () => generateBlockId());

      // Assert
      // Even if timestamps are the same, random parts should differ
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("performance", () => {
    it("should generate ID in less than 1ms", () => {
      // Arrange
      const iterations = 10;
      const maxTimePerGeneration = 1; // ms

      // Act
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        generateBlockId();
      }
      const endTime = performance.now();

      // Assert
      const averageTime = (endTime - startTime) / iterations;
      expect(averageTime).toBeLessThan(maxTimePerGeneration);
    });

    it("should generate 1000 IDs quickly", () => {
      // Arrange
      const count = 1000;
      const maxTotalTime = 100; // ms for 1000 generations

      // Act
      const startTime = performance.now();
      for (let i = 0; i < count; i++) {
        generateBlockId();
      }
      const endTime = performance.now();

      // Assert
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(maxTotalTime);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive calls", () => {
      // Arrange & Act
      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        ids.push(generateBlockId());
      }

      // Assert
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });

    it("should generate valid IDs without special characters", () => {
      // Arrange & Act
      const ids = Array.from({ length: 20 }, () => generateBlockId());

      // Assert
      for (const id of ids) {
        // Should only contain alphanumeric and hyphens
        expect(id).toMatch(/^[a-z0-9-]+$/);
        // Should not contain spaces or special chars
        expect(id).not.toMatch(/[\s!@#$%^&*()+=[\]{}|\\;:'",.<>?/]/);
      }
    });
  });
});
