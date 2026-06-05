import { describe, expect, it } from "vitest";

import { isValidCalendarDate } from "./is-valid-calendar-date";

describe("isValidCalendarDate", () => {
  it("should accept a real calendar date", () => {
    // Arrange
    const value = "2026-06-01";

    // Act
    const result = isValidCalendarDate(value);

    // Assert
    expect(result).toBe(true);
  });

  it("should reject month 13 (2026-13-01)", () => {
    // Arrange
    const value = "2026-13-01";

    // Act
    const result = isValidCalendarDate(value);

    // Assert
    expect(result).toBe(false);
  });

  it("should reject Feb 31 (2026-02-31)", () => {
    // Arrange
    const value = "2026-02-31";

    // Act
    const result = isValidCalendarDate(value);

    // Assert
    expect(result).toBe(false);
  });

  it("should reject a malformed shape", () => {
    // Arrange
    const value = "2026-6-1";

    // Act
    const result = isValidCalendarDate(value);

    // Assert
    expect(result).toBe(false);
  });
});
