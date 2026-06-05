import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { todayIsoDate } from "./today-iso-date";

describe("todayIsoDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the current UTC date as YYYY-MM-DD", () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-05T10:30:00Z"));

    // Act
    const result = todayIsoDate();

    // Assert
    expect(result).toBe("2026-06-05");
  });

  it("should use the UTC calendar day across midnight boundaries", () => {
    // Arrange
    vi.setSystemTime(new Date("2026-06-05T23:59:59Z"));

    // Act
    const result = todayIsoDate();

    // Assert
    expect(result).toBe("2026-06-05");
  });
});
