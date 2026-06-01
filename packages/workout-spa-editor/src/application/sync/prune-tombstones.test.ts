import { describe, expect, it } from "vitest";

import type { Tombstone } from "../../types/snapshot";
import { pruneTombstones, TOMBSTONE_RETENTION_MS } from "./prune-tombstones";

const ONE_SECOND_MS = 1000;

const tombstones: ReadonlyArray<Tombstone> = [
  { table: "workouts", id: "fresh", deletedAt: "2026-05-20T00:00:00Z" },
  { table: "workouts", id: "stale", deletedAt: "2026-01-01T00:00:00Z" },
];

describe("pruneTombstones", () => {
  it("should drop tombstones older than the retention window", () => {
    // Arrange
    const now = new Date("2026-06-01T00:00:00Z");

    // Act
    const kept = pruneTombstones(tombstones, now);

    // Assert
    expect(kept.map((t) => t.id)).toEqual(["fresh"]);
  });

  it("should keep tombstones inside the retention window", () => {
    // Arrange
    const cutoff = new Date(
      Date.parse("2026-05-20T00:00:00Z") +
        TOMBSTONE_RETENTION_MS -
        ONE_SECOND_MS
    );

    // Act
    const kept = pruneTombstones(tombstones, cutoff);

    // Assert
    expect(kept.map((t) => t.id)).toContain("fresh");
  });
});
