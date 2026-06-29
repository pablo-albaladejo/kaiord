/**
 * KRD Validator Tests
 */

import { describe, expect, it } from "vitest";

import { ValidationError } from "../types/errors";
import { validateKRD } from "./krd-validator";

describe("validateKRD", () => {
  describe("valid KRD", () => {
    it("should validate minimal valid workout KRD", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      // Act
      const result = validateKRD(data);

      // Assert
      expect(result).toStrictEqual(data);
    });

    it("should validate recorded activity KRD", () => {
      // Arrange
      const data = {
        version: "1.0",
        type: "recorded_activity",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
      };

      // Act
      const result = validateKRD(data);

      // Assert
      expect(result).toStrictEqual(data);
    });
  });

  describe("missing required fields", () => {
    it.each([
      {
        field: "version",
        message: "Missing required field",
        data: {
          type: "structured_workout",
          metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
        },
      },
      {
        field: "type",
        message: "Missing required field",
        data: {
          version: "1.0",
          metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
        },
      },
      {
        field: "metadata",
        message: "Missing required field",
        data: { version: "1.0", type: "structured_workout" },
      },
      {
        field: "metadata.created",
        message: "Missing required field",
        data: {
          version: "1.0",
          type: "structured_workout",
          metadata: { sport: "running" },
        },
      },
      {
        field: "metadata.sport",
        message: "Missing required field",
        data: {
          version: "1.0",
          type: "structured_workout",
          metadata: { created: "2025-01-15T10:30:00Z" },
        },
      },
      {
        field: "extensions.structured_workout",
        message: "Missing required field for workout type",
        data: {
          version: "1.0",
          type: "structured_workout",
          metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
          extensions: {},
        },
      },
    ])(
      "should throw ValidationError when $field is missing",
      ({ field, message, data }) => {
        // Arrange
        let caught: unknown;

        // Act
        try {
          validateKRD(data);
        } catch (error) {
          caught = error;
        }

        // Assert
        expect(caught).toBeInstanceOf(ValidationError);
        if (caught instanceof ValidationError) {
          expect(caught.errors).toContainEqual({ field, message });
        }
      }
    );

    it("should list all missing fields", () => {
      // Arrange
      const data = {};
      let caught: unknown;

      // Act
      try {
        validateKRD(data);
      } catch (error) {
        caught = error;
      }

      // Assert
      expect(caught).toBeInstanceOf(ValidationError);
      if (caught instanceof ValidationError) {
        expect(caught.errors.length).toBeGreaterThan(1);
        expect(caught.message).toBe("KRD validation failed");
      }
    });
  });

  describe("invalid field values", () => {
    it.each([
      {
        field: "version",
        message: "Invalid value",
        data: {
          version: 1.0,
          type: "structured_workout",
          metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
        },
      },
      {
        field: "type",
        message: "Invalid value",
        data: {
          version: "1.0",
          type: "invalid",
          metadata: { created: "2025-01-15T10:30:00Z", sport: "running" },
        },
      },
      {
        field: "metadata",
        message: "Must be an object",
        data: {
          version: "1.0",
          type: "structured_workout",
          metadata: "invalid",
        },
      },
      {
        field: "root",
        message: "Expected an object",
        data: "invalid",
      },
    ])(
      "should throw ValidationError for invalid $field",
      ({ field, message, data }) => {
        // Arrange
        let caught: unknown;

        // Act
        try {
          validateKRD(data);
        } catch (error) {
          caught = error;
        }

        // Assert
        expect(caught).toBeInstanceOf(ValidationError);
        if (caught instanceof ValidationError) {
          expect(caught.errors).toContainEqual({ field, message });
        }
      }
    );
  });
});
