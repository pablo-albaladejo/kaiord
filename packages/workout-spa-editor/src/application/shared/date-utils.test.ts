import { describe, expect, it } from "vitest";

import { localIsoDate } from "./date-utils";

describe("localIsoDate", () => {
  it("should give the local calendar day, not the UTC one, near midnight", () => {
    // Arrange
    const lateEvening = new Date("2026-11-23T23:30:00");

    // Act
    const day = localIsoDate(lateEvening);

    // Assert
    expect(day).toBe("2026-11-23");
  });

  it("should pad the month, the day and a short year", () => {
    // Arrange
    const early = new Date("0987-01-05T00:00:00");

    // Act
    const day = localIsoDate(early);

    // Assert
    expect(day).toBe("0987-01-05");
  });
});
