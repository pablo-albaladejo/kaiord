import { describe, expect, it } from "vitest";

import { deriveExternalId } from "./derive-external-id";

describe("deriveExternalId", () => {
  it("should produce a stable hash for the same payload + measuredAt", () => {
    // Arrange
    const input = {
      payload: { weightKilograms: 75.5, kind: "weight" },
      measuredAt: "2026-01-01T08:00:00.000Z",
    };

    // Act
    const first = deriveExternalId(input);
    const second = deriveExternalId(input);

    // Assert
    expect(first).toBe(second);
  });

  it("should produce a different hash when measuredAt changes", () => {
    // Arrange
    const payload = { weightKilograms: 75.5, kind: "weight" };

    // Act
    const a = deriveExternalId({
      payload,
      measuredAt: "2026-01-01T08:00:00.000Z",
    });
    const b = deriveExternalId({
      payload,
      measuredAt: "2026-01-02T08:00:00.000Z",
    });

    // Assert
    expect(a).not.toBe(b);
  });

  it("should produce a different hash when payload changes", () => {
    // Arrange
    const measuredAt = "2026-01-01T08:00:00.000Z";

    // Act
    const a = deriveExternalId({
      payload: { weightKilograms: 75.5 },
      measuredAt,
    });
    const b = deriveExternalId({
      payload: { weightKilograms: 80.0 },
      measuredAt,
    });

    // Assert
    expect(a).not.toBe(b);
  });

  it("should produce the same hash regardless of payload key order", () => {
    // Arrange
    const measuredAt = "2026-01-01T08:00:00.000Z";

    // Act
    const a = deriveExternalId({ payload: { a: 1, b: 2 }, measuredAt });
    const b = deriveExternalId({ payload: { b: 2, a: 1 }, measuredAt });

    // Assert
    expect(a).toBe(b);
  });

  it("should prefix output with the k1: version tag", () => {
    // Arrange
    const input = {
      payload: { rMSSD: 42, kind: "hrv" },
      measuredAt: "2026-05-01T06:00:00.000Z",
    };

    // Act
    const result = deriveExternalId(input);

    // Assert
    expect(result.startsWith("k1:")).toBe(true);
  });
});
