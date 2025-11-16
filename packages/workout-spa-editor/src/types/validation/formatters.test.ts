/**
 * Error Formatting Tests
 *
 * Tests for validation error formatting utilities.
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { ValidationError } from "../../types/krd";
import { formatValidationErrors, formatZodError } from "./formatters";

describe("validation formatters", () => {
  describe("formatZodError", () => {
    it("should format single Zod error", () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });

      // Act
      if (!result.success) {
        const formatted = formatZodError(result.error);

        // Assert
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
      const result = schema.safeParse({ name: 123, age: "invalid" });

      // Act
      if (!result.success) {
        const formatted = formatZodError(result.error);

        // Assert
        expect(formatted.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should preserve error codes", () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({});

      // Act
      if (!result.success) {
        const formatted = formatZodError(result.error);

        // Assert
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
      const result = schema.safeParse({ user: { name: 123 } });

      // Act
      if (!result.success) {
        const formatted = formatZodError(result.error);

        // Assert
        expect(formatted[0].path).toEqual(["user", "name"]);
      }
    });

    it("should handle array errors", () => {
      // Arrange
      const schema = z.object({
        items: z.array(z.number()),
      });
      const result = schema.safeParse({ items: [1, "invalid", 3] });

      // Act
      if (!result.success) {
        const formatted = formatZodError(result.error);

        // Assert
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

    it("should format single error", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["name"], message: "Required field" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe("name: Required field");
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

    it("should handle nested paths with dots", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps", 0, "duration"], message: "Invalid duration" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe("steps.0.duration: Invalid duration");
    });

    it("should handle empty path", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: [], message: "General error" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe("General error");
    });

    it("should handle deep nesting", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        {
          path: ["extensions", "workout", "steps", 0, "duration", "seconds"],
          message: "Must be positive",
        },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toBe(
        "extensions.workout.steps.0.duration.seconds: Must be positive"
      );
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

    it("should handle mixed path types", () => {
      // Arrange
      const errors: Array<ValidationError> = [
        { path: ["steps", 0, "name"], message: "Required" },
        { path: ["metadata", "sport"], message: "Invalid" },
      ];

      // Act
      const result = formatValidationErrors(errors);

      // Assert
      expect(result).toContain("steps.0.name: Required");
      expect(result).toContain("metadata.sport: Invalid");
    });
  });
});
