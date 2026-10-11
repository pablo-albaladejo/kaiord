import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lastSevenDays, todayIso } from "./health-date-windows";

// 00:30 local (no offset in the string) on 11 Oct is still 10 Oct in UTC for any UTC+n zone.
const JUST_AFTER_LOCAL_MIDNIGHT = new Date("2026-10-11T00:30:00");

describe("health date windows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(JUST_AFTER_LOCAL_MIDNIGHT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should name today by the local calendar day", () => {
    // Arrange

    // Act
    const today = todayIso();

    // Assert
    expect(today).toBe("2026-10-11");
  });

  it("should end the seven-day window on the local today", () => {
    // Arrange

    // Act
    const range = lastSevenDays();

    // Assert
    expect(range).toEqual({ start: "2026-10-05", end: "2026-10-11" });
  });
});
