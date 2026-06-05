import { describe, expect, it } from "vitest";

import { calendarWeekHref } from "./calendar-week-href";

describe("calendarWeekHref", () => {
  it("should map a date to its ISO calendar week route", () => {
    // Arrange
    const date = "2026-06-01";

    // Act
    const href = calendarWeekHref(date);

    // Assert
    expect(href).toBe("/calendar/2026-W23");
  });

  it("should keep a Sunday inside the week that started the prior Monday", () => {
    // Arrange
    const sunday = "2026-06-07";

    // Act
    const href = calendarWeekHref(sunday);

    // Assert
    expect(href).toBe("/calendar/2026-W23");
  });

  it("should keep the week stable in far-east timezones at week boundaries", () => {
    // Arrange
    const previousTz = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";

    // Act
    const href = calendarWeekHref("2026-06-07");

    // Assert
    expect(href).toBe("/calendar/2026-W23");
    process.env.TZ = previousTz;
  });

  it("should resolve year-boundary dates to the ISO week-numbering year", () => {
    // Arrange
    const date = "2026-01-01";

    // Act
    const href = calendarWeekHref(date);

    // Assert
    expect(href).toBe("/calendar/2026-W01");
  });
});
