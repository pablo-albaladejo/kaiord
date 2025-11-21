/**
 * Step ID Parser Tests
 *
 * Feature: step-selection-unique-ids, Property 2: ID Parsing Round-Trip
 * Validates: Requirements 2.4
 */

import { describe, expect, it } from "vitest";
import type { StepIdParts } from "./step-id-parser";
import { parseStepId, reconstructStepId } from "./step-id-parser";

describe("parseStepId", () => {
  describe("main workout step IDs", () => {
    it("should parse step-1 format", () => {
      // Arrange
      const id = "step-1";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        stepIndex: 1,
      });
    });

    it("should parse step-0 format", () => {
      // Arrange
      const id = "step-0";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        stepIndex: 0,
      });
    });

    it("should parse step with large index", () => {
      // Arrange
      const id = "step-999";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        stepIndex: 999,
      });
    });
  });

  describe("block step IDs", () => {
    it("should parse block-2-step-1 format", () => {
      // Arrange
      const id = "block-2-step-1";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        blockIndex: 2,
        stepIndex: 1,
      });
    });

    it("should parse block-0-step-0 format", () => {
      // Arrange
      const id = "block-0-step-0";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        blockIndex: 0,
        stepIndex: 0,
      });
    });

    it("should parse block step with large indices", () => {
      // Arrange
      const id = "block-100-step-50";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "step",
        blockIndex: 100,
        stepIndex: 50,
      });
    });
  });

  describe("block IDs", () => {
    it("should parse block-2 format", () => {
      // Arrange
      const id = "block-2";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "block",
        blockIndex: 2,
      });
    });

    it("should parse block-0 format", () => {
      // Arrange
      const id = "block-0";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "block",
        blockIndex: 0,
      });
    });

    it("should parse block with large index", () => {
      // Arrange
      const id = "block-999";

      // Act
      const result = parseStepId(id);

      // Assert
      expect(result).toStrictEqual({
        type: "block",
        blockIndex: 999,
      });
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid format", () => {
      // Arrange
      const id = "invalid-format";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for empty string", () => {
      // Arrange
      const id = "";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for malformed step ID", () => {
      // Arrange
      const id = "step-";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for malformed block ID", () => {
      // Arrange
      const id = "block-";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for malformed block step ID", () => {
      // Arrange
      const id = "block-2-step-";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for non-numeric indices", () => {
      // Arrange
      const id = "step-abc";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for extra parts", () => {
      // Arrange
      const id = "step-1-extra";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for null input", () => {
      // Arrange
      const id = null as unknown as string;

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for undefined input", () => {
      // Arrange
      const id = undefined as unknown as string;

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for non-string input", () => {
      // Arrange
      const id = 123 as unknown as string;

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for block step with non-numeric block index", () => {
      // Arrange
      const id = "block-abc-step-1";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for block step with non-numeric step index", () => {
      // Arrange
      const id = "block-1-step-abc";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for block with non-numeric index", () => {
      // Arrange
      const id = "block-abc";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for negative step index", () => {
      // Arrange
      const id = "step--1";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for negative block index", () => {
      // Arrange
      const id = "block--1";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for missing step keyword in block step", () => {
      // Arrange
      const id = "block-1-2";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should throw error for wrong order in block step", () => {
      // Arrange
      const id = "step-1-block-2";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow("Invalid step ID format");
    });

    it("should include the invalid ID in error message", () => {
      // Arrange
      const id = "invalid-id-format";

      // Act & Assert
      expect(() => parseStepId(id)).toThrow(id);
    });
  });
});

describe("reconstructStepId", () => {
  describe("round-trip property", () => {
    it("should reconstruct main workout step ID", () => {
      // Arrange
      const originalId = "step-1";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });

    it("should reconstruct block step ID", () => {
      // Arrange
      const originalId = "block-2-step-1";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });

    it("should reconstruct block ID", () => {
      // Arrange
      const originalId = "block-2";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });

    it("should round-trip step-0", () => {
      // Arrange
      const originalId = "step-0";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });

    it("should round-trip block-0-step-0", () => {
      // Arrange
      const originalId = "block-0-step-0";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });

    it("should round-trip with large indices", () => {
      // Arrange
      const originalId = "block-999-step-888";

      // Act
      const parsed = parseStepId(originalId);
      const reconstructed = reconstructStepId(parsed);

      // Assert
      expect(reconstructed).toBe(originalId);
    });
  });

  describe("reconstruction from parts", () => {
    it("should reconstruct main workout step from parts", () => {
      // Arrange
      const parts: StepIdParts = {
        type: "step",
        stepIndex: 5,
      };

      // Act
      const id = reconstructStepId(parts);

      // Assert
      expect(id).toBe("step-5");
    });

    it("should reconstruct block step from parts", () => {
      // Arrange
      const parts: StepIdParts = {
        type: "step",
        blockIndex: 3,
        stepIndex: 7,
      };

      // Act
      const id = reconstructStepId(parts);

      // Assert
      expect(id).toBe("block-3-step-7");
    });

    it("should reconstruct block from parts", () => {
      // Arrange
      const parts: StepIdParts = {
        type: "block",
        blockIndex: 4,
      };

      // Act
      const id = reconstructStepId(parts);

      // Assert
      expect(id).toBe("block-4");
    });
  });

  describe("error handling", () => {
    it("should throw error for step without stepIndex", () => {
      // Arrange
      const parts: StepIdParts = {
        type: "step",
      } as StepIdParts;

      // Act & Assert
      expect(() => reconstructStepId(parts)).toThrow("Invalid step ID parts");
    });

    it("should throw error for block without blockIndex", () => {
      // Arrange
      const parts: StepIdParts = {
        type: "block",
      } as StepIdParts;

      // Act & Assert
      expect(() => reconstructStepId(parts)).toThrow("Invalid step ID parts");
    });
  });
});
