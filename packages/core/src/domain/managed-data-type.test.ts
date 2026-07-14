import { describe, expect, it } from "vitest";

import { canonicalHash } from "./hash/canonical-hash";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "./managed-data-type";

const EXPECTED_TYPE_COUNT = 13;

describe("managedDataTypes", () => {
  it("should enumerate exactly thirteen managed data types", () => {
    // Arrange
    const types = managedDataTypes;

    // Act
    const count = types.length;

    // Assert
    expect(count).toBe(EXPECTED_TYPE_COUNT);
  });

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

  it("should map planned-session and activity to their wire tokens", () => {
    // Arrange

    // Act
    const planned = MANAGED_DATA_REGISTRY["planned-session"];
    const activity = MANAGED_DATA_REGISTRY["activity"];

    // Assert
    expect(planned.capabilities.import).toBe("read:training-plan");
    expect(activity.capabilities.import).toBe("read:activities");
  });

  it("should use opaque-string capability tokens (no Zod-enum import from SPA)", () => {
    // Arrange
    const definedTokens = Object.values(MANAGED_DATA_REGISTRY)
      .flatMap((e) => [e.capabilities.import, e.capabilities.export])
      .filter((t) => t !== undefined);

    // Act
    const allStrings = definedTokens.every((t) => typeof t === "string");

    // Assert
    expect(allStrings).toBe(true);
    expect(definedTokens.length).toBeGreaterThan(0);
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
