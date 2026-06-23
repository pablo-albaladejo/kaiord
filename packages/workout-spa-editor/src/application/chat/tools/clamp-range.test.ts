import { describe, expect, it } from "vitest";

import { clampRange } from "./clamp-range";

const TODAY = "2026-06-13";
const WINDOW_DAYS = 20;
// 366 days (MAX_RANGE_DAYS) before TODAY; 2026 spans a non-leap Feb, so a
// full year back is 2025-06-13 and one more day is 2025-06-12.
const MAX_WINDOW_FROM = "2025-06-12";

describe("clampRange", () => {
  it("should default the window to the recent N days ending today", () => {
    // Arrange
    const input = {};

    // Act
    const range = clampRange(input, TODAY, WINDOW_DAYS);

    // Assert
    expect(range).toEqual({ from: "2026-05-24", to: TODAY });
  });

  it("should honor an explicit in-bounds range", () => {
    // Arrange
    const input = { dateFrom: "2026-06-01", dateTo: "2026-06-10" };

    // Act
    const range = clampRange(input, TODAY);

    // Assert
    expect(range).toEqual({ from: "2026-06-01", to: "2026-06-10" });
  });

  it("should clamp a span wider than the maximum to the max window", () => {
    // Arrange
    const input = { dateFrom: "2000-01-01", dateTo: TODAY };

    // Act
    const range = clampRange(input, TODAY);

    // Assert
    expect(range.from).toBe(MAX_WINDOW_FROM);
    expect(range.to).toBe(TODAY);
  });

  it("should collapse an inverted range to a single day", () => {
    // Arrange
    const input = { dateFrom: "2026-06-10", dateTo: "2026-06-01" };

    // Act
    const range = clampRange(input, TODAY);

    // Assert
    expect(range).toEqual({ from: "2026-06-01", to: "2026-06-01" });
  });
});
