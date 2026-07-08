import { describe, expect, it } from "vitest";

import { formatDateLabel } from "./format-date-label";

describe("formatDateLabel", () => {
  it("should format a date in English by default", () => {
    // Arrange
    const date = "2026-05-04";

    // Act
    const label = formatDateLabel(date);

    // Assert
    expect(label).toBe("Monday, May 4");
  });

  it("should format a date in Spanish for the es locale", () => {
    // Arrange
    const date = "2026-05-04";

    // Act
    const label = formatDateLabel(date, "es");

    // Assert
    expect(label).toBe("lunes, 4 de mayo");
  });

  it("should return an empty string for an empty date", () => {
    // Arrange
    const date = "";

    // Act
    const label = formatDateLabel(date, "es");

    // Assert
    expect(label).toBe("");
  });
});
