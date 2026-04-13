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
  it("returns a 64-character hex string (SHA-256)", async () => {
    const hash = await computeRawHash(makeRaw());

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces deterministic output for same input", async () => {
    const raw = makeRaw();

    const hash1 = await computeRawHash(raw);
    const hash2 = await computeRawHash(raw);

    expect(hash1).toBe(hash2);
  });

  it("trims title whitespace", async () => {
    const hash1 = await computeRawHash(makeRaw({ title: "Run" }));
    const hash2 = await computeRawHash(makeRaw({ title: "  Run  " }));

    expect(hash1).toBe(hash2);
  });

  it("trims description whitespace", async () => {
    const hash1 = await computeRawHash(makeRaw({ description: "Zone 2" }));
    const hash2 = await computeRawHash(makeRaw({ description: "  Zone 2  " }));

    expect(hash1).toBe(hash2);
  });

  it("normalizes CRLF to LF in description", async () => {
    const hash1 = await computeRawHash(
      makeRaw({ description: "line1\nline2" })
    );
    const hash2 = await computeRawHash(
      makeRaw({ description: "line1\r\nline2" })
    );

    expect(hash1).toBe(hash2);
  });

  it("produces different hash for different content", async () => {
    const hash1 = await computeRawHash(makeRaw({ title: "Run" }));
    const hash2 = await computeRawHash(makeRaw({ title: "Bike" }));

    expect(hash1).not.toBe(hash2);
  });

  it("handles empty comments array", async () => {
    const hash = await computeRawHash(makeRaw({ comments: [] }));

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("sorts comments by timestamp ascending", async () => {
    const comments = [
      { author: "coach", text: "b", timestamp: "2025-01-15T12:00:00Z" },
      { author: "coach", text: "a", timestamp: "2025-01-15T10:00:00Z" },
    ];
    const reversed = [...comments].reverse();

    const hash1 = await computeRawHash(makeRaw({ comments }));
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    expect(hash1).toBe(hash2);
  });

  it("breaks timestamp tie by author then text", async () => {
    const ts = "2025-01-15T10:00:00Z";
    const comments = [
      { author: "bob", text: "z", timestamp: ts },
      { author: "alice", text: "a", timestamp: ts },
    ];
    const reversed = [...comments].reverse();

    const hash1 = await computeRawHash(makeRaw({ comments }));
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    expect(hash1).toBe(hash2);
  });

  it("breaks author tie by text lexicographically", async () => {
    const ts = "2025-01-15T10:00:00Z";
    const comments = [
      { author: "coach", text: "beta", timestamp: ts },
      { author: "coach", text: "alpha", timestamp: ts },
    ];
    const reversed = [...comments].reverse();

    const hash1 = await computeRawHash(makeRaw({ comments }));
    const hash2 = await computeRawHash(makeRaw({ comments: reversed }));

    expect(hash1).toBe(hash2);
  });

  it("trims comment text", async () => {
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
    const hash2 = await computeRawHash(makeRaw({ comments: c2 }));

    expect(hash1).toBe(hash2);
  });

  it("handles Unicode content correctly", async () => {
    const raw = makeRaw({
      title: "Entrenamiento de fuerza",
      description: "Sentadillas con barra olimpica",
      comments: [
        {
          author: "entrenador",
          text: "Buena sesion!",
          timestamp: "2025-01-15T10:00:00Z",
        },
      ],
    });

    const hash = await computeRawHash(raw);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles emoji in content", async () => {
    const raw = makeRaw({
      title: "Morning run",
      description: "Easy pace with strides",
      comments: [
        {
          author: "coach",
          text: "Great job!",
          timestamp: "2025-01-15T10:00:00Z",
        },
      ],
    });

    const hash = await computeRawHash(raw);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
