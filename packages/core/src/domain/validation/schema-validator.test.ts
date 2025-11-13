import { describe, expect, it } from "vitest";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { createSchemaValidator } from "./schema-validator.js";

describe("createSchemaValidator", () => {
  it("should create a schema validator with validate method", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const validator = createSchemaValidator(logger);

    // Assert
    expect(validator).toBeDefined();
    expect(validator.validate).toBeDefined();
    expect(typeof validator.validate).toBe("function");
  });
});

describe("SchemaValidator.validate", () => {
  it("should return empty array when validating valid KRD", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const validKrd = buildKRD.build();

    // Act
    const errors = validator.validate(validKrd);

    // Assert
    expect(errors).toStrictEqual([]);
  });

  it("should return validation errors when KRD is missing required version field", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "version")).toBe(true);
  });

  it("should return validation errors when KRD is missing required type field", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "type")).toBe(true);
  });

  it("should return validation errors when KRD is missing required metadata field", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "workout",
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "metadata")).toBe(true);
  });

  it("should return validation errors when version has invalid format", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "invalid",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "version")).toBe(true);
  });

  it("should return validation errors when type has invalid value", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "invalid",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "type")).toBe(true);
  });

  it("should return validation errors when metadata.created is not ISO 8601 datetime", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "invalid-date",
        sport: "running",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field.includes("metadata.created"))).toBe(true);
  });

  it("should return validation errors when metadata.sport is missing", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
      },
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field.includes("metadata.sport"))).toBe(true);
  });

  it("should return multiple validation errors when multiple fields are invalid", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
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
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
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

  it("should return validation errors when sessions array contains invalid session", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      sessions: [
        {
          startTime: "invalid-date",
          totalElapsedTime: -100,
          sport: "running",
        },
      ],
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field.includes("sessions"))).toBe(true);
  });

  it("should map Zod error to ValidationError with field path", () => {
    // Arrange
    const logger = createMockLogger();
    const validator = createSchemaValidator(logger);
    const invalidKrd = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      sessions: [
        {
          startTime: "2025-01-15T10:30:00Z",
          totalElapsedTime: -100,
          sport: "running",
        },
      ],
    };

    // Act
    const errors = validator.validate(invalidKrd);

    // Assert
    const sessionError = errors.find((e) =>
      e.field.includes("sessions.0.totalElapsedTime")
    );
    expect(sessionError).toBeDefined();
    expect(sessionError?.message).toBeDefined();
  });
});
