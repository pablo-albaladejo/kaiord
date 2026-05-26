import { describe, expect, it } from "vitest";

import { canonicalHash } from "./canonical-hash";

describe("canonicalHash", () => {
  it("should produce identical digests regardless of key insertion order", () => {
    // Arrange
    const a = { b: 1, a: 2 };
    const b = { a: 2, b: 1 };

    // Act
    const hashA = canonicalHash(a);
    const hashB = canonicalHash(b);

    // Assert
    expect(hashA).toBe(hashB);
  });

  it("should produce different digests when a value changes", () => {
    // Arrange
    const original = { kg: 72.4, measuredAt: "2026-05-22T07:15:00.000Z" };
    const modified = { kg: 73.0, measuredAt: "2026-05-22T07:15:00.000Z" };

    // Act
    const hashOriginal = canonicalHash(original);
    const hashModified = canonicalHash(modified);

    // Assert
    expect(hashOriginal).not.toBe(hashModified);
  });

  it("should return a non-empty hex string", () => {
    // Arrange
    const input = { foo: "bar" };

    // Act
    const result = canonicalHash(input);

    // Assert
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
