import { describe, expect, it } from "vitest";

import { generateBlockId } from "./id-generation";

describe("generateBlockId", () => {
  describe("ID format consistency", () => {
    it("should generate ID with correct format", () => {
      // Arrange & Act
      // Arrange

      // Act

      const id = generateBlockId();

      // Assert

      // Assert

      expect(id).toMatch(/^block-\d+-[a-z0-9]+$/);
    });

    it("should start with 'block-' prefix", () => {
      // Arrange & Act
      // Arrange

      // Act

      const id = generateBlockId();

      // Assert

      // Assert

      expect(id).toMatch(/^block-/);
    });

    it("should contain timestamp component", () => {
      // Arrange & Act
      // Arrange

      const id = generateBlockId();

      // Act

      const parts = id.split("-");

      // Assert

      // Assert

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("block");
      expect(Number(parts[1])).toBeGreaterThan(0);
    });

    it("should contain random string component", () => {
      // Arrange & Act
      // Arrange

      const id = generateBlockId();

      // Act

      const parts = id.split("-");

      // Assert

      // Assert

      expect(parts).toHaveLength(3);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe("uniqueness across multiple calls", () => {
    it("should generate unique IDs for consecutive calls", () => {
      // Arrange & Act
      // Arrange

      const id1 = generateBlockId();
      const id2 = generateBlockId();

      // Act

      const id3 = generateBlockId();

      // Assert

      // Assert

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it("should generate unique IDs across many calls", () => {
      // Arrange
      // Arrange

      const count = 100;

      // Act
      const ids = Array.from({ length: count }, () => generateBlockId());

      // Act

      const uniqueIds = new Set(ids);

      // Assert

      // Assert

      expect(uniqueIds.size).toBe(count);
    });

    it("should generate different random components even with same timestamp", () => {
      // Arrange & Act
      // Generate multiple IDs in quick succession (likely same timestamp)
      // Arrange

      const ids = Array.from({ length: 10 }, () => generateBlockId());

      // Assert
      // Even if timestamps are the same, random parts should differ

      // Act

      const uniqueIds = new Set(ids);

      // Assert

      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("performance", () => {
    it("should generate ID in less than 1ms", () => {
      // Arrange
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

      // Act

      const averageTime = (endTime - startTime) / iterations;

      // Assert

      expect(averageTime).toBeLessThan(maxTimePerGeneration);
    });

    it("should generate 1000 IDs quickly", () => {
      // Arrange
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

      // Act

      const totalTime = endTime - startTime;

      // Assert

      expect(totalTime).toBeLessThan(maxTotalTime);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive calls", () => {
      // Arrange & Act
      // Arrange

      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        ids.push(generateBlockId());
      }

      // Assert

      // Act

      const uniqueIds = new Set(ids);

      // Assert

      expect(uniqueIds.size).toBe(50);
    });

    it("should generate valid IDs without special characters", () => {
      // Arrange

      // Act

      // Assert

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
