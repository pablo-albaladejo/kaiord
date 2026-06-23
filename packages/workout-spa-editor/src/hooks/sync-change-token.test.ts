/**
 * buildChangeToken — the cloud auto-push change token must advance on
 * creates, deletes, and in-place edits (not just row-count changes). It is
 * assembled from per-table { count, latest } signals read via an index.
 */
import { describe, expect, it } from "vitest";

import { buildChangeToken, type TableSignal } from "./sync-change-token";

describe("buildChangeToken", () => {
  it("should join each table's count and latest timestamp", () => {
    // Arrange
    const signals: TableSignal[] = [
      { count: 2, latest: "2026-05-02T00:00:00.000Z" },
      { count: 1, latest: "2026-05-01T00:00:00.000Z" },
    ];

    // Act
    const token = buildChangeToken(signals);

    // Assert
    expect(token).toBe("2:2026-05-02T00:00:00.000Z|1:2026-05-01T00:00:00.000Z");
  });

  it("should change the token on an in-place edit even when the count is unchanged", () => {
    // Arrange
    const before = buildChangeToken([
      { count: 1, latest: "2026-05-01T00:00:00.000Z" },
    ]);

    // Act
    const after = buildChangeToken([
      { count: 1, latest: "2026-05-09T00:00:00.000Z" },
    ]);

    // Assert
    expect(after).not.toBe(before);
  });

  it("should advance the token when a row count changes", () => {
    // Arrange
    const before = buildChangeToken([
      { count: 1, latest: "2026-05-01T00:00:00.000Z" },
    ]);

    // Act
    const after = buildChangeToken([
      { count: 2, latest: "2026-05-01T00:00:00.000Z" },
    ]);

    // Assert
    expect(after).not.toBe(before);
  });

  it("should return a zero-count token for an empty database", () => {
    // Arrange
    const signals: TableSignal[] = [
      { count: 0, latest: "" },
      { count: 0, latest: "" },
    ];

    // Act
    const token = buildChangeToken(signals);

    // Assert
    expect(token).toBe("0:|0:");
  });
});
