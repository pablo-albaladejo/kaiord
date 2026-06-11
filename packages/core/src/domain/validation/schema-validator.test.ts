import { describe, expect, it } from "vitest";

import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createSchemaValidator } from "./schema-validator.js";

const validMetadata = {
  created: "2025-01-15T10:30:00Z",
  sport: "running",
};

describe("createSchemaValidator", () => {
  it("should create a schema validator with validate method", () => {
    // Arrange

    // Act
    const validator = createSchemaValidator();

    // Assert
    expect(typeof validator.validate).toBe("function");
  });
});

describe("SchemaValidator.validate", () => {
  it("should return empty array when validating valid KRD", () => {
    // Arrange
    const validator = createSchemaValidator();
    const validKrd = buildKRD.build();

    // Act
    const errors = validator.validate(validKrd);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it.each([
    ["version", { type: "structured_workout", metadata: validMetadata }],
    ["type", { version: "1.0", metadata: validMetadata }],
    ["metadata", { version: "1.0", type: "structured_workout" }],
    [
      "version",
      {
        version: "invalid",
        type: "structured_workout",
        metadata: validMetadata,
      },
    ],
    ["type", { version: "1.0", type: "invalid", metadata: validMetadata }],
    [
      "metadata.created",
      {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "invalid-date", sport: "running" },
      },
    ],
    [
      "metadata.sport",
      {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2025-01-15T10:30:00Z" },
      },
    ],
  ])(
    "should surface a %s validation error for the matching invalid KRD",
    (field, invalidKrd) => {
      // Arrange
      const validator = createSchemaValidator();

      // Act
      const errors = validator.validate(invalidKrd);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field.includes(field))).toBe(true);
    }
  );

  it("should return multiple validation errors when multiple fields are invalid", () => {
    // Arrange
    const validator = createSchemaValidator();
    const invalidKrd = {
      version: "invalid",
      type: "invalid",
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(2);
  });

  it("should validate optional fields when present and valid", () => {
    // Arrange
    const validator = createSchemaValidator();
    const validKrd = buildKRD.build({
      sessions: [],
      laps: [],
      records: [],
      events: [],
      extensions: { custom: "data" },
    });

    // Act
    const errors = validator.validate(validKrd);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it("should map Zod error to ValidationError with field path", () => {
    // Arrange
    const validator = createSchemaValidator();
    const invalidKrd = {
      version: "1.0",
      type: "structured_workout",
      metadata: validMetadata,
      sessions: [
        {
          startTime: "2025-01-15T10:30:00Z",
          totalElapsedTime: -100,
          sport: "running",
        },
      ],
    };
    const errors = validator.validate(invalidKrd);

    // Act
    const sessionError = errors.find((e) =>
      e.field.includes("sessions.0.totalElapsedTime")
    );

    // Assert
    expect(sessionError?.field).toContain("sessions.0.totalElapsedTime");
    expect(sessionError?.message).toMatch(/\S/);
  });
});
