import { createHash } from "node:crypto";

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

  it("should match the previous node:crypto SHA-256 hex (external-id compatibility)", () => {
    // Arrange
    // Keys are already alphabetically sorted at every depth, so `normalize`
    // is a no-op and we can compare against node:crypto over the identical
    // canonical JSON — pinning byte-for-byte output so external-ids derived
    // by the old implementation still match.
    const sortedInputs: Array<Record<string, unknown>> = [
      {},
      { a: 1 },
      { a: 1, b: "two" },
      { a: 1, b: { c: 2, d: [1, 2] }, e: null },
      // Non-ASCII / multibyte UTF-8 — the path most at risk of cross-impl
      // drift; pins identical UTF-8 byte encoding vs node:crypto.
      { name: "Ångström", note: "café ☕ 日本" },
    ];

    // Act

    // Assert
    for (const input of sortedInputs) {
      const expected = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");
      expect(canonicalHash(input)).toBe(expected);
    }
  });
});
