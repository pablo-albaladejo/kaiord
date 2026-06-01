/**
 * buildChangeToken — the cloud auto-push change token must advance on
 * creates, deletes, and in-place edits (not just row-count changes).
 */
import { describe, expect, it } from "vitest";

import { buildChangeToken } from "./sync-change-token";

describe("buildChangeToken", () => {
  it("should combine the total row count with the latest timestamp", () => {
    // Arrange
    const tables = {
      workouts: [{ id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" }],
      templates: [{ id: "t-1", createdAt: "2026-05-02T00:00:00.000Z" }],
    };

    // Act
    const token = buildChangeToken(tables);

    // Assert
    expect(token).toBe("2:2026-05-02T00:00:00.000Z");
  });

  it("should change the token on an in-place edit even when the count is unchanged", () => {
    // Arrange
    const before = buildChangeToken({
      workouts: [{ id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" }],
    });

    // Act
    const after = buildChangeToken({
      workouts: [{ id: "w-1", updatedAt: "2026-05-09T00:00:00.000Z" }],
    });

    // Assert
    expect(after).not.toBe(before);
  });

  it("should advance the token when a tombstone records a deletion", () => {
    // Arrange
    const before = buildChangeToken({
      workouts: [{ id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" }],
      tombstones: [],
    });

    // Act
    const after = buildChangeToken({
      workouts: [{ id: "w-1", updatedAt: "2026-05-01T00:00:00.000Z" }],
      tombstones: [
        { table: "workouts", id: "w-9", deletedAt: "2026-05-10T00:00:00.000Z" },
      ],
    });

    // Assert
    expect(after).not.toBe(before);
  });

  it("should return a zero-count token for an empty database", () => {
    // Arrange
    const tables = { workouts: [], templates: [] };

    // Act
    const token = buildChangeToken(tables);

    // Assert
    expect(token).toBe("0:");
  });
});
