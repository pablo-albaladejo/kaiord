/**
 * Error Formatting Tests
 *
 * Tests for validation error formatting utilities.
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { ValidationError } from "../../types/krd";
import { formatValidationErrors, formatZodError } from "./formatters";
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const MIXED_ARRAY_FIXTURE = [1, "invalid", 3] as const;

describe("validation formatters", () => {
  describe("formatZodError", () => {
    it("should format single Zod error", () => {
      // Arrange
      const schema = z.object({ name: z.string() });

      // Act
      const result = schema.safeParse({ name: 123 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toHaveLength(1);
        expect(formatted[0].path).toEqual(["name"]);
        expect(formatted[0].message).toBeDefined();
      }
    });

    it("should format multiple Zod errors", () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // Act
      const result = schema.safeParse({ name: 123, age: "invalid" });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should preserve error codes", () => {
      // Arrange
      const schema = z.object({ name: z.string() });

      // Act
      const result = schema.safeParse({});

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted[0].code).toBeDefined();
      }
    });

    it("should handle nested object errors", () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          name: z.string(),
        }),
      });

      // Act
      const result = schema.safeParse({ user: { name: 123 } });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted[0].path).toEqual(["user", "name"]);
      }
    });

    it("should handle array errors", () => {
      // Arrange
      const schema = z.object({
        items: z.array(z.number()),
      });

      // Act
      const result = schema.safeParse({ items: MIXED_ARRAY_FIXTURE });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted[0].path).toContain("items");
        expect(formatted[0].path).toContain(1);
      }
    });
  });

  describe("formatValidationErrors", () => {
    it("should return empty string for no errors", () => {
      // Arrange
      const errors: Array<ValidationError> = [];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe("");
    });

    it.each<{
      path: Array<string | number>;
      message: string;
      expected: string;
    }>([
      {
        path: ["name"],
        message: "Required field",
        expected: "name: Required field",
      },
      {
        path: ["steps", 0, "duration"],
        message: "Invalid duration",
        expected: "steps.0.duration: Invalid duration",
      },
      { path: [], message: "General error", expected: "General error" },
      {
        path: [
          "extensions",
          "structured_workout",
          "steps",
          0,
          "duration",
          "seconds",
        ],
        message: "Must be positive",
        expected:
          "extensions.structured_workout.steps.0.duration.seconds: Must be positive",
      },
      {
        path: ["steps", 0, "name"],
        message: "Required",
        expected: "steps.0.name: Required",
      },
      {
        path: ["metadata", "sport"],
        message: "Invalid",
        expected: "metadata.sport: Invalid",
      },
    ])("should format $expected", ({ path, message, expected }) => {
      // Arrange
      const errors: Array<ValidationError> = [{ path, message }];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe(expected);
    });

    it("should format multiple errors with newlines", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
        { path: ["sport"], message: "Invalid sport" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toContain("name: Required field");
      expect(result).toContain("sport: Invalid sport");
      expect(result).toContain("\n");
    });

    it("should preserve error order", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["first"], message: "First error" },
        { path: ["second"], message: "Second error" },
        { path: ["third"], message: "Third error" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      const lines = result.split("\n");
      expect(lines[0]).toBe("first: First error");
      expect(lines[1]).toBe("second: Second error");
      expect(lines[2]).toBe("third: Third error");
    });
  });
});
