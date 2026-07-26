import { describe, expect, it } from "vitest";

import { canonicalHash } from "./hash/canonical-hash";
import type { ManagedDataType } from "./managed-data-type";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "./managed-data-type";

describe("managedDataTypes", () => {
  it("should replace training-plan with planned-session and activity", () => {
    // Arrange
    const types = [...managedDataTypes] as string[];

    // Act

    // Assert
    expect(types).not.toContain("training-plan");
    expect(types).toContain("planned-session");
    expect(types).toContain("activity");
  });
});

describe("MANAGED_DATA_REGISTRY", () => {
  it("should expose label, schema, and capabilities for every entry", () => {
    // Arrange
    const entries = Object.values(MANAGED_DATA_REGISTRY);

    // Act
    const valid = entries.every(
      (e) =>
        typeof e.label === "string" &&
        e.label.length > 0 &&
        e.schema !== undefined &&
        typeof e.capabilities === "object"
    );

    // Assert
    expect(valid).toBe(true);
  });

  it("should back every entry with a real schema (no z.unknown passthrough)", () => {
    // Arrange
    // A z.unknown()/z.any() passthrough accepts `undefined`; every real
    // object/enum schema rejects it. Mechanical proxy for the "0 z.unknown()
    // in the registry" invariant.
    const entries = Object.values(MANAGED_DATA_REGISTRY);

    // Act
    const accepting = entries.filter(
      (e) => e.schema.safeParse(undefined).success
    );

    // Assert
    expect(accepting).toEqual([]);
  });

  it.each([
    {
      type: "planned-session" as ManagedDataType,
      expected: { import: "read:training-plan" },
    },
    {
      type: "activity" as ManagedDataType,
      expected: { import: "read:activities" },
    },
    {
      type: "body-composition" as ManagedDataType,
      expected: { import: "read:body", export: "write:body" },
    },
  ])("should map $type to its wire capability tokens", ({ type, expected }) => {
    // Arrange

    // Act
    const entry = MANAGED_DATA_REGISTRY[type];

    // Assert
    expect(entry.capabilities).toEqual(expected);
  });

  it("should produce a stable hash output when an unrelated optional Zod field is added", () => {
    // Arrange
    const projection = MANAGED_DATA_REGISTRY["weight"].hashProjection!;
    const base = { weightKilograms: 72.4, measuredAt: "2026-05-22T07:15:00Z" };
    const withExtra = {
      ...base,
      unrealatedOptionalField: "ignored",
    };

    // Act
    const hashBase = canonicalHash(projection(base));
    const hashWithExtra = canonicalHash(projection(withExtra));

    // Assert
    expect(hashBase).toBe(hashWithExtra);
  });

  it("should produce a different hash output when a canonical business field changes", () => {
    // Arrange
    const projection = MANAGED_DATA_REGISTRY["weight"].hashProjection!;
    const original = {
      weightKilograms: 72.4,
      measuredAt: "2026-05-22T07:15:00Z",
    };
    const changed = {
      weightKilograms: 73.0,
      measuredAt: "2026-05-22T07:15:00Z",
    };

    // Act
    const hashOriginal = canonicalHash(projection(original));
    const hashChanged = canonicalHash(projection(changed));

    // Assert
    expect(hashOriginal).not.toBe(hashChanged);
  });
});
