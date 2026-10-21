import { describe, expect, it } from "vitest";

import { formatShortDay } from "./action-input";

describe("formatShortDay", () => {
  it.each(["2026-02-31", "2026-13-01", "2026-04-31", "16/10/2026", ""])(
    "should return null for %j, which is not a calendar day",
    (day) => {
      // Arrange
      const locale = "en";

      // Act
      const formatted = formatShortDay(day, locale);

      // Assert
      expect(formatted).toBeNull();
    }
  );

  it("should format a real day, including a leap day", () => {
    // Arrange
    const day = "2028-02-29";

    // Act
    const formatted = formatShortDay(day, "en");

    // Assert
    expect(formatted).toBe("Feb 29");
  });
});
