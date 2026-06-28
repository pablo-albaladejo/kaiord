/**
 * JSON Parser Tests
 */

import { describe, expect, it } from "vitest";

import { FileParsingError } from "../types/errors";
import { parseJSON } from "./json-parser";

const BYTES_PER_KB = 1024;
const KB_FIVE = 5;
const KB_TWENTY = 20;
const ITEM_COUNT_THOUSAND = 1000;
const ITEM_VALUE_MULTIPLIER = 2;
const ESTIMATED_BYTES_PER_ITEM = 50;
const FIXTURE_VALUE_42 = 42;
const ERROR_MESSAGE_MIN_LENGTH = 10;
const ARRAY_VALUE_THIRD = 3;
const FIXTURE_ARRAY_VALUES = [1, 2, ARRAY_VALUE_THIRD] as const;

describe("parseJSON", () => {
  describe("valid JSON", () => {
    it.each([
      {
        shape: "object",
        json: '{"name": "test", "value": 42}',
        expected: { name: "test", value: FIXTURE_VALUE_42 },
      },
      {
        shape: "array",
        json: "[1, 2, 3]",
        expected: FIXTURE_ARRAY_VALUES,
      },
      {
        shape: "nested object",
        json: '{"outer": {"inner": "value"}}',
        expected: { outer: { inner: "value" } },
      },
      {
        shape: "empty object",
        json: "{}",
        expected: {},
      },
      {
        shape: "empty array",
        json: "[]",
        expected: [],
      },
      {
        shape: "null",
        json: "null",
        expected: null,
      },
      {
        shape: "boolean values",
        json: '{"flag": true, "other": false}',
        expected: { flag: true, other: false },
      },
    ])("should parse valid JSON ($shape)", ({ json, expected }) => {
      // Arrange

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual(expected);
    });
  });

  describe("invalid JSON", () => {
    it("should throw FileParsingError for invalid JSON", () => {
      // Arrange
      const json = '{"name": "test"';

      // Act

      // Assert
      expect(() => parseJSON(json)).toThrow(FileParsingError);
    });

    it("should include error message even when line and column are undefined", () => {
      // Arrange
      const json = '{\n  "name": "test",\n  "value": invalid\n}';
      let caught: unknown;

      // Act
      try {
        parseJSON(json);
      } catch (error) {
        caught = error;
      }

      // Assert
      expect(caught).toBeInstanceOf(FileParsingError);
      if (caught instanceof FileParsingError) {
        expect(caught.message).toContain("Invalid JSON");
        expect(caught.cause).toBeDefined();
      }
    });
  });

  describe("integration tests", () => {
    it("should parse large valid JSON correctly", () => {
      // Arrange
      const largeObject = {
        data: Array.from({ length: ITEM_COUNT_THOUSAND }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          value: i * ITEM_VALUE_MULTIPLIER,
        })),
      };
      const json = JSON.stringify(largeObject);

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual(largeObject);
    });

    it("should parse duplicate keys with last value winning", () => {
      // Arrange
      const json = '{"name": "test", "name": "duplicate"}';

      // Act
      const result = parseJSON(json);

      // Assert
      expect(result).toStrictEqual({ name: "duplicate" });
    });

    it("should handle various JSON error types gracefully", () => {
      // Arrange
      const invalidJSONs = [
        '{"unclosed": "string',
        '{"trailing": "comma",}',
        '{unquoted: "key"}',
        '{"number": 123.456.789}',
        '{"array": [1, 2, 3,]}',
        '{"nested": {"unclosed": }',
      ];

      // Act

      // Assert
      for (const json of invalidJSONs) {
        try {
          parseJSON(json);
          expect.fail(`Should have thrown for: ${json}`);
        } catch (error) {
          expect(error).toBeInstanceOf(FileParsingError);
          if (error instanceof FileParsingError) {
            expect(error.message).toContain("Invalid JSON");
            expect(error.cause).toBeDefined();
            expect(error.message.length).toBeGreaterThan(
              ERROR_MESSAGE_MIN_LENGTH
            );
          }
        }
      }
    });

    it("should preserve original error information in cause", () => {
      // Arrange
      const json = '{"invalid": }';
      let caught: unknown;

      // Act
      try {
        parseJSON(json);
      } catch (error) {
        caught = error;
      }

      // Assert
      expect(caught).toBeInstanceOf(FileParsingError);
      if (caught instanceof FileParsingError) {
        expect(caught.cause).toBeDefined();
        expect(caught.cause).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe("input-size coverage", () => {
    /**
     * Generate JSON string of approximately target size in bytes.
     */
    const generateJSONOfSize = (targetBytes: number): string => {
      const itemCount = Math.floor(targetBytes / ESTIMATED_BYTES_PER_ITEM);
      const data = Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        name: `item-${i}`,
        value: i * ITEM_VALUE_MULTIPLIER,
      }));
      return JSON.stringify({ data });
    };

    it("should parse three increasing input sizes deterministically (fast-path)", () => {
      // Arrange
      const sizes = [
        BYTES_PER_KB,
        KB_FIVE * BYTES_PER_KB,
        KB_TWENTY * BYTES_PER_KB,
      ];

      // Act

      // Assert
      for (const bytes of sizes) {
        const json = generateJSONOfSize(bytes);
        const result = parseJSON<{ data: unknown[] }>(json);
        expect(result).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
