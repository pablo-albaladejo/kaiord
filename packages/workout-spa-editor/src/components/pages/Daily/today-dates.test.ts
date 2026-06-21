import { describe, expect, it } from "vitest";

import { addDaysIso, toIsoDate, weekDays } from "./today-dates";

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

describe("addDaysIso", () => {
  it("should cross the week boundary backward (Monday → prior Sunday)", () => {
    // Arrange
    const monday = "2026-06-08";

    // Act
    const prev = addDaysIso(monday, -1);

    // Assert
    expect(prev).toBe("2026-06-07");
  });

  it("should cross the week boundary forward (Sunday → next Monday)", () => {
    // Arrange
    const sunday = "2026-06-14";

    // Act
    const next = addDaysIso(sunday, 1);

    // Assert
    expect(next).toBe("2026-06-15");
  });

  it("should cross a month/year boundary", () => {
    // Arrange
    const newYearsEve = "2026-12-31";

    // Act
    const next = addDaysIso(newYearsEve, 1);

    // Assert
    expect(next).toBe("2027-01-01");
  });
});

describe("weekDays", () => {
  it("should return seven Monday-to-Sunday days", () => {
    // Arrange

    // Act
    const days = weekDays(WEDNESDAY, "2026-05-27");

    // Assert
    expect(days).toHaveLength(WEEK_LENGTH);
    expect(days[0].iso).toBe("2026-05-25");
    expect(days[WEEK_LENGTH - 1].iso).toBe("2026-05-31");
  });

  it("should flag the focused day and the real today distinctly", () => {
    // Arrange
    const realTodayIso = "2026-05-25";

    // Act
    const days = weekDays(WEDNESDAY, realTodayIso);

    // Assert
    const focused = days.filter((d) => d.isFocused);
    const realToday = days.filter((d) => d.isRealToday);
    expect(focused).toHaveLength(1);
    expect(focused[0].iso).toBe("2026-05-27");
    expect(realToday).toHaveLength(1);
    expect(realToday[0].iso).toBe("2026-05-25");
  });
});
