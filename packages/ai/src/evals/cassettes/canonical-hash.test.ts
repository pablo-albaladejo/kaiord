import { describe, expect, it } from "vitest";

import { canonicalize, canonicalSchema, hashOf } from "./canonical-hash";

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

describe("canonicalize", () => {
  it.each([
    ["URLs", new URL("https://a.example"), new URL("https://b.example")],
    ["dates", new Date(0), new Date(1)],
    ["byte arrays", new Uint8Array([1]), new Uint8Array([2])],
  ])("should hash two different %s differently", (_label, a, b) => {
    // Arrange

    // Act
    const hashes = [hashOf({ value: a }), hashOf({ value: b })];

    // Assert
    expect(hashes[1]).not.toBe(hashes[0]);
  });

  it("should serialize a URL, a Date and bytes by content under a type tag", () => {
    // Arrange
    const value = {
      url: new URL("https://a.example/x"),
      at: new Date(0),
      bytes: new Uint8Array([1]),
    };

    // Act
    const canonical = canonicalize(value);

    // Assert
    expect(canonical).toEqual({
      at: { "\u0000Date": "1970-01-01T00:00:00.000Z" },
      bytes: { "\u0000bytes": [1] },
      url: { "\u0000URL": "https://a.example/x" },
    });
  });

  it.each([
    ["bytes and a plain array", new Uint8Array([1]), [1]],
    ["a URL and its href", new URL("https://a.example/"), "https://a.example/"],
    ["a Date and its ISO string", new Date(0), "1970-01-01T00:00:00.000Z"],
  ])("should hash %s differently", (_label, tagged, plain) => {
    // Arrange

    // Act
    const hashes = [hashOf({ value: tagged }), hashOf({ value: plain })];

    // Assert
    expect(hashes[1]).not.toBe(hashes[0]);
  });

  it("should reject a plain object using the reserved tag prefix", () => {
    // Arrange
    const forged = { value: { "\u0000bytes": [1] } };

    // Act
    const act = () => hashOf(forged);

    // Assert
    expect(act).toThrow("reserved key");
  });

  it("should reject a Map rather than hash it as an empty object", () => {
    // Arrange
    const value = { map: new Map([["k", "v"]]) };

    // Act
    const act = () => hashOf(value);

    // Assert
    expect(act).toThrow("cannot canonicalize a Map");
  });
});
