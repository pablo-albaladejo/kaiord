import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { todayIsoDate } from "./today-iso-date";

describe("todayIsoDate", () => {
  const prevTz = process.env.TZ;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = prevTz;
  });

  it("should return the current local date as YYYY-MM-DD", () => {
    // Arrange
    process.env.TZ = "UTC";
    vi.setSystemTime(new Date("2026-06-05T10:30:00Z"));

    // Act
    const result = todayIsoDate();

    // Assert
    expect(result).toBe("2026-06-05");
  });

  it("should use the local calendar day near a non-UTC midnight boundary", () => {
    // Arrange
    // 23:30 local on Jun 15 in New York is 03:30Z on Jun 16; the local day
    // (Jun 15) must win, not the UTC day (Jun 16). Regression for #747.
    process.env.TZ = "America/New_York";
    vi.setSystemTime(new Date("2026-06-16T03:30:00Z"));

    // Act
    const result = todayIsoDate();

    // Assert
    expect(result).toBe("2026-06-15");
  });

  it("should use the local calendar day for an early-morning far-east time", () => {
    // Arrange
    // 06:00 local on Jun 16 in Tokyo is 21:00Z on Jun 15; the local day
    // (Jun 16) must win, not the UTC day (Jun 15).
    process.env.TZ = "Asia/Tokyo";
    vi.setSystemTime(new Date("2026-06-15T21:00:00Z"));

    // Act
    const result = todayIsoDate();

    // Assert
    expect(result).toBe("2026-06-16");
  });
});
