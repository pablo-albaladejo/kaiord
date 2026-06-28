import { describe, expect, it } from "vitest";

import type { WorkoutRaw } from "../types/calendar-fragments";
import { computeRawHash } from "./raw-hash";

const makeRaw = (overrides: Partial<WorkoutRaw> = {}): WorkoutRaw => ({
  title: "Easy run",
  description: "Zone 2 easy pace",
  comments: [],
  distance: null,
  duration: null,
  prescribedRpe: null,
  rawHash: "",
  ...overrides,
});

describe("computeRawHash", () => {
  it("should return a 64-character hex string (SHA-256)", async () => {
    // Arrange

    // Act
    const hash = await computeRawHash(makeRaw());

    // Assert
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce deterministic output for same input", async () => {
    // Arrange
    const raw = makeRaw();
    const hash1 = await computeRawHash(raw);

    // Act
    const hash2 = await computeRawHash(raw);

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should trim title whitespace", async () => {
    // Arrange
    const hash1 = await computeRawHash(makeRaw({ title: "Run" }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ title: "  Run  " }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should trim description whitespace", async () => {
    // Arrange
    const hash1 = await computeRawHash(makeRaw({ description: "Zone 2" }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ description: "  Zone 2  " }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should normalize CRLF to LF in description", async () => {
    // Arrange
    const hash1 = await computeRawHash(
      makeRaw({ description: "line1\nline2" })
    );

    // Act
    const hash2 = await computeRawHash(
      makeRaw({ description: "line1\r\nline2" })
    );

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should produce different hash for different content", async () => {
    // Arrange
    const hash1 = await computeRawHash(makeRaw({ title: "Run" }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ title: "Bike" }));

    // Assert
    expect(hash1).not.toBe(hash2);
  });

  it("should sort comments by timestamp ascending", async () => {
    // Arrange
    const comments = [
      { author: "coach", text: "b", timestamp: "2025-01-15T12:00:00Z" },
      { author: "coach", text: "a", timestamp: "2025-01-15T10:00:00Z" },
    ];
    const reversed = [...comments].reverse();
    const hash1 = await computeRawHash(makeRaw({ comments }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should break timestamp tie by author then text", async () => {
    // Arrange
    const ts = "2025-01-15T10:00:00Z";
    const comments = [
      { author: "bob", text: "z", timestamp: ts },
      { author: "alice", text: "a", timestamp: ts },
    ];
    const reversed = [...comments].reverse();
    const hash1 = await computeRawHash(makeRaw({ comments }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should break author tie by text lexicographically", async () => {
    // Arrange
    const ts = "2025-01-15T10:00:00Z";
    const comments = [
      { author: "coach", text: "beta", timestamp: ts },
      { author: "coach", text: "alpha", timestamp: ts },
    ];
    const reversed = [...comments].reverse();
    const hash1 = await computeRawHash(makeRaw({ comments }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should trim comment text", async () => {
    // Arrange
    const c1 = [
      { author: "coach", text: "hello", timestamp: "2025-01-15T10:00:00Z" },
    ];
    const c2 = [
      {
        author: "coach",
        text: "  hello  ",
        timestamp: "2025-01-15T10:00:00Z",
      },
    ];
    const hash1 = await computeRawHash(makeRaw({ comments: c1 }));

    // Act
    const hash2 = await computeRawHash(makeRaw({ comments: c2 }));

    // Assert
    expect(hash1).toBe(hash2);
  });

  it("should handle multi-byte Unicode and emoji content", async () => {
    // Arrange
    const raw = makeRaw({
      title: "Café entrenamiento ☕",
      description: "Sesión de fuerza 🏋️ con barra olímpica",
      comments: [
        {
          author: "entrenador",
          text: "¡Buena sesión! 🏃‍♂️💪",
          timestamp: "2025-01-15T10:00:00Z",
        },
      ],
    });

    // Act
    const hash = await computeRawHash(raw);

    // Assert
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
