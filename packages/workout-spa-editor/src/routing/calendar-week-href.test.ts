import { describe, expect, it } from "vitest";

import { calendarWeekHref } from "./calendar-week-href";

describe("calendarWeekHref", () => {
  it.each([
    {
      label: "a date to its ISO calendar week route",
      date: "2026-06-01",
      href: "/calendar/2026-W23",
    },
    {
      label: "a Sunday inside the week that started the prior Monday",
      date: "2026-06-07",
      href: "/calendar/2026-W23",
    },
    {
      label: "a year-boundary date to the ISO week-numbering year",
      date: "2026-01-01",
      href: "/calendar/2026-W01",
    },
  ])("should map $label", ({ date, href }) => {
    // Arrange

    // Act
    const result = calendarWeekHref(date);

    // Assert
    expect(result).toBe(href);
  });

  it("should keep the week stable in far-east timezones at week boundaries", () => {
    // Arrange
    const previousTz = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";

    try {
      // Act
      const href = calendarWeekHref("2026-06-07");

      // Assert
      expect(href).toBe("/calendar/2026-W23");
    } finally {
      process.env.TZ = previousTz;
    }
  });
});
