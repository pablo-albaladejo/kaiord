import { describe, expect, it } from "vitest";

import { summarizeHealth } from "./summarize-health";

describe("summarizeHealth", () => {
  it("should sort records by date ascending", () => {
    // Arrange
    const records = [
      { date: "2026-06-03", krd: { v: 3 } },
      { date: "2026-06-01", krd: { v: 1 } },
      { date: "2026-06-02", krd: { v: 2 } },
    ];

    // Act
    const summary = summarizeHealth(records);

    // Assert
    expect(summary.records.map((r) => r.date)).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
  });

  it("should report the full count and forward each record's payload", () => {
    // Arrange
    const records = [{ date: "2026-06-01", krd: { hours: 7 } }];

    // Act
    const summary = summarizeHealth(records);

    // Assert
    expect(summary.count).toBe(1);
    expect(summary.records[0].krd).toEqual({ hours: 7 });
  });
});
