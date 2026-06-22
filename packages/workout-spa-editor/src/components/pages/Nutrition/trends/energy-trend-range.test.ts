import { describe, expect, it } from "vitest";

import { resolveTrendRange } from "./energy-trend-range";

const WINDOW_30 = 30;
const WINDOW_90 = 90;

describe("resolveTrendRange", () => {
  it("should end on the anchor and span the inclusive window", () => {
    // Arrange
    const anchor = "2026-06-30";

    // Act
    const range = resolveTrendRange(anchor, WINDOW_30);

    // Assert
    expect(range.end).toBe("2026-06-30");
    expect(range.start).toBe("2026-06-01");
  });

  it("should resolve a 90-day window across quarter boundaries", () => {
    // Arrange
    const anchor = "2026-06-30";

    // Act
    const range = resolveTrendRange(anchor, WINDOW_90);

    // Assert
    expect(range.start).toBe("2026-04-02");
    expect(range.end).toBe("2026-06-30");
  });
});
