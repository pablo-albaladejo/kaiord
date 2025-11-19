/**
 * JSON Parser Tests
 */

import { describe, expect, it } from "vitest";
import { FileParsingError } from "../types/errors";
import { parseJSON } from "./json-parser";

describe("parseJSON", () => {
  describe("valid JSON", () => {
    it("should parse valid JSON object", () => {
      // Arrange
      const json = '{"name": "test", "value": 42}';

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual({ name: "test", value: 42 });
    });

    it("should parse valid JSON array", () => {
      // Arrange
      const json = "[1, 2, 3]";

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual([1, 2, 3]);
    });

    it("should parse nested JSON", () => {
      // Arrange
      const json = '{"outer": {"inner": "value"}}';

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual({ outer: { inner: "value" } });
    });
  });

  describe("invalid JSON", () => {
    it("should throw FileParsingError for invalid JSON", () => {
      // Arrange
      const json = '{"name": "test"';

      // Act & Assert
      expect(() => parseJSON(json)).toThrow(FileParsingError);
    });

    it("should include line and column for syntax errors", () => {
      // Arrange
      const json = '{\n  "name": "test",\n  "value": invalid\n}';

      // Act & Assert
      try {
        parseJSON(json);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FileParsingError);
        if (error instanceof FileParsingError) {
          expect(error.line).toBeDefined();
          expect(error.column).toBeDefined();
          expect(error.message).toContain("Invalid JSON");
        }
      }
    });

    it("should handle missing closing brace", () => {
      // Arrange
      const json = '{"name": "test", "value": 42';

      // Act & Assert
      expect(() => parseJSON(json)).toThrow(FileParsingError);
    });

    it("should handle trailing comma", () => {
      // Arrange
      const json = '{"name": "test",}';

      // Act & Assert
      expect(() => parseJSON(json)).toThrow(FileParsingError);
    });

    it("should handle unquoted keys", () => {
      // Arrange
      const json = '{name: "test"}';

      // Act & Assert
      expect(() => parseJSON(json)).toThrow(FileParsingError);
    });
  });

  describe("edge cases", () => {
    it("should parse empty object", () => {
      // Arrange
      const json = "{}";

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual({});
    });

    it("should parse empty array", () => {
      // Arrange
      const json = "[]";

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual([]);
    });

    it("should parse null", () => {
      // Arrange
      const json = "null";

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toBeNull();
    });

    it("should parse boolean values", () => {
      // Arrange
      const json = '{"flag": true, "other": false}';

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual({ flag: true, other: false });
    });
  });
});
