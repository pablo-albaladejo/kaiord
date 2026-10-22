import { describe, expect, it } from "vitest";

import { canonicalSchema, hashOf } from "./canonical-hash";

const SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    sport: { type: "string", enum: ["cycling", "running"] },
    steps: { type: "array", items: { $schema: "nested", type: "object" } },
  },
  required: ["sport", "steps"],
};

const schemaHash = (schema: unknown) => hashOf(canonicalSchema(schema));

describe("canonicalSchema", () => {
  it("should strip $schema at every level and keep every other key", () => {
    // Arrange

    // Act
    const canonical = canonicalSchema(SCHEMA);

    // Assert
    expect(canonical).toEqual({
      properties: {
        sport: { enum: ["cycling", "running"], type: "string" },
        steps: { items: { type: "object" }, type: "array" },
      },
      required: ["sport", "steps"],
      type: "object",
    });
  });

  it("should hash reordered keys the same", () => {
    // Arrange
    const reordered = {
      required: SCHEMA.required,
      properties: {
        steps: SCHEMA.properties.steps,
        sport: SCHEMA.properties.sport,
      },
      type: "object",
      $schema: SCHEMA.$schema,
    };

    // Act
    const hashes = [schemaHash(SCHEMA), schemaHash(reordered)];

    // Assert
    expect(hashes[1]).toBe(hashes[0]);
  });

  it("should hash a new $schema URI the same", () => {
    // Arrange
    const bumped = {
      ...SCHEMA,
      $schema: "https://json-schema.org/draft/2020-12/schema",
    };

    // Act
    const hashes = [schemaHash(SCHEMA), schemaHash(bumped)];

    // Assert
    expect(hashes[1]).toBe(hashes[0]);
  });

  it("should hash a changed field description differently", () => {
    // Arrange
    const described = {
      ...SCHEMA,
      properties: {
        ...SCHEMA.properties,
        sport: { ...SCHEMA.properties.sport, description: "The sport" },
      },
    };

    // Act
    const hashes = [schemaHash(SCHEMA), schemaHash(described)];

    // Assert
    expect(hashes[1]).not.toBe(hashes[0]);
  });

  it("should hash a changed constraint differently", () => {
    // Arrange
    const constrained = {
      ...SCHEMA,
      properties: {
        ...SCHEMA.properties,
        steps: { ...SCHEMA.properties.steps, minItems: 1 },
      },
    };

    // Act
    const hashes = [schemaHash(SCHEMA), schemaHash(constrained)];

    // Assert
    expect(hashes[1]).not.toBe(hashes[0]);
  });

  it("should keep array order significant", () => {
    // Arrange
    const swapped = { ...SCHEMA, required: ["steps", "sport"] };

    // Act
    const hashes = [schemaHash(SCHEMA), schemaHash(swapped)];

    // Assert
    expect(hashes[1]).not.toBe(hashes[0]);
  });
});
