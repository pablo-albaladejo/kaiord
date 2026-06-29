import { describe, expect, it } from "vitest";

import { generateBlockId } from "./id-generation";

const ID_PARTS_COUNT = 3;
const UNIQUENESS_CALL_COUNT = 100;

describe("generateBlockId", () => {
  describe("ID format consistency", () => {
    it("should generate ID with correct format", () => {
      // Arrange

      // Act
      const id = generateBlockId();

      // Assert
      expect(id).toMatch(/^block-\d+-[a-z0-9]+$/);
    });

    it("should contain timestamp component", () => {
      // Arrange

      // Act
      const id = generateBlockId();
      const parts = id.split("-");

      // Assert
      expect(parts).toHaveLength(ID_PARTS_COUNT);
      expect(parts[0]).toBe("block");
      expect(Number(parts[1])).toBeGreaterThan(0);
    });
  });

  describe("uniqueness across multiple calls", () => {
    it("should generate unique IDs across many calls", () => {
      // Arrange

      // Act
      const ids = Array.from({ length: UNIQUENESS_CALL_COUNT }, () =>
        generateBlockId()
      );
      const uniqueIds = new Set(ids);

      // Assert
      expect(uniqueIds.size).toBe(UNIQUENESS_CALL_COUNT);
    });
  });
});
