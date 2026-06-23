import { describe, expect, it } from "vitest";

import { rangeDatesInclusive } from "./range-dates";

describe("rangeDatesInclusive", () => {
  it("should enumerate every day inclusive of both ends", () => {
    // Arrange
    const start = "2026-06-01";
    const end = "2026-06-03";

    // Act
    const result = rangeDatesInclusive(start, end);

    // Assert
    expect(result).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("should return a single day when start equals end", () => {
    // Arrange
    const day = "2026-06-15";

    // Act
    const result = rangeDatesInclusive(day, day);

    // Assert
    expect(result).toEqual(["2026-06-15"]);
  });

  it("should cross a month boundary correctly", () => {
    // Arrange
    const start = "2026-06-29";
    const end = "2026-07-02";

    // Act
    const result = rangeDatesInclusive(start, end);

    // Assert
    expect(result).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
    ]);
  });

  it("should return an empty list when start is after end", () => {
    // Arrange
    const start = "2026-06-10";
    const end = "2026-06-01";

    // Act
    const result = rangeDatesInclusive(start, end);

    // Assert
    expect(result).toEqual([]);
  });
});
