import { describe, expect, it } from "vitest";

import {
  getAdjacentWeekId,
  getCurrentWeekId,
  getWeekDays,
  getWeekIdForDate,
  parseWeekId,
} from "./week-utils";

const DAYS_PER_WEEK = 7;

describe("parseWeekId", () => {
  it("should parse valid week ID", () => {
    // Arrange

    // Act

    const result = parseWeekId("2026-W15");

    // Assert

    expect(result).toEqual({
      weekId: "2026-W15",
      start: "2026-04-06",
      end: "2026-04-12",
    });
  });

  it("should return null for malformed input", () => {
    // Arrange

    // Act

    // Assert
    expect(parseWeekId("not-a-week")).toBeNull();
    expect(parseWeekId("2026-W00")).toBeNull();
    expect(parseWeekId("2026-W99")).toBeNull();
    expect(parseWeekId("")).toBeNull();
  });

  it("should parse week 1 of the year", () => {
    // Arrange

    // Act

    const result = parseWeekId("2026-W01");

    // Assert

    expect(result).not.toBeNull();
    expect(result!.start).toBe("2025-12-29");
  });
});

describe("getCurrentWeekId", () => {
  it("should return a valid week ID format", () => {
    // Arrange

    // Act

    const weekId = getCurrentWeekId();

    // Assert

    expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getWeekIdForDate", () => {
  it("should return correct week ID for a known date", () => {
    // Arrange

    // Act

    const result = getWeekIdForDate(new Date("2026-04-11"));

    // Assert

    expect(result).toBe("2026-W15");
  });
});

describe("getAdjacentWeekId", () => {
  it("should return next week", () => {
    // Arrange

    // Act

    const result = getAdjacentWeekId("2026-W15", 1);

    // Assert

    expect(result).toBe("2026-W16");
  });

  it("should return previous week", () => {
    // Arrange

    // Act

    const result = getAdjacentWeekId("2026-W15", -1);

    // Assert

    expect(result).toBe("2026-W14");
  });

  it("should handle year boundary", () => {
    // Arrange

    // Act

    const result = getAdjacentWeekId("2026-W01", -1);

    // Assert

    expect(result).toBe("2025-W52");
  });

  it("should fall back to current week for invalid input", () => {
    // Arrange

    // Act

    const result = getAdjacentWeekId("invalid", 1);

    // Assert

    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getWeekDays", () => {
  it("should return 7 days for a valid week", () => {
    // Arrange

    // Act

    const days = getWeekDays("2026-W15");

    // Assert

    expect(days).toHaveLength(DAYS_PER_WEEK);
    expect(days[0]).toBe("2026-04-06");
    expect(days[6]).toBe("2026-04-12");
  });

  it("should return empty for invalid week", () => {
    // Arrange

    // Act

    const days = getWeekDays("invalid");

    // Assert

    expect(days).toHaveLength(0);
  });
});
