import { describe, expect, it } from "vitest";

import { toIsoDate, weekDays } from "./today-dates";

const WEEK_LENGTH = 7;
const YEAR = 2026;
const MAY = 4;
const JAN = 0;
const WED_DAY = 27;
const FIFTH = 5;
// A known Wednesday: 2026-05-27.
const WEDNESDAY = new Date(YEAR, MAY, WED_DAY);

describe("toIsoDate", () => {
  it("should format a date as local YYYY-MM-DD", () => {
    // Arrange
    const date = new Date(YEAR, JAN, FIFTH);

    // Act
    const iso = toIsoDate(date);

    // Assert
    expect(iso).toBe("2026-01-05");
  });
});

describe("weekDays", () => {
  it("should return seven Monday-to-Sunday days", () => {
    // Arrange

    // Act
    const days = weekDays(WEDNESDAY);

    // Assert
    expect(days).toHaveLength(WEEK_LENGTH);
    expect(days[0].iso).toBe("2026-05-25");
    expect(days[WEEK_LENGTH - 1].iso).toBe("2026-05-31");
  });

  it("should flag the matching day as today", () => {
    // Arrange

    // Act
    const days = weekDays(WEDNESDAY);

    // Assert
    const todays = days.filter((d) => d.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0].iso).toBe("2026-05-27");
  });
});
