import { describe, expect, it } from "vitest";

import { contextDefaultDate } from "./context-default-date";

const TODAY = "2026-10-08";

describe("contextDefaultDate", () => {
  it("should propose today without a week", () => {
    // Arrange
    const week = null;

    // Act
    const date = contextDefaultDate(week, TODAY);

    // Assert
    expect(date).toBe(TODAY);
  });

  it("should propose today when the week holds it", () => {
    // Arrange
    const week = "2026-W41";

    // Act
    const date = contextDefaultDate(week, TODAY);

    // Assert
    expect(date).toBe(TODAY);
  });

  it("should propose the first day of another week", () => {
    // Arrange
    const week = "2026-W43";

    // Act
    const date = contextDefaultDate(week, TODAY);

    // Assert
    expect(date).toBe("2026-10-19");
  });

  it("should fall back to today for a malformed week", () => {
    // Arrange
    const week = "2026-W99";

    // Act
    const date = contextDefaultDate(week, TODAY);

    // Assert
    expect(date).toBe(TODAY);
  });
});
