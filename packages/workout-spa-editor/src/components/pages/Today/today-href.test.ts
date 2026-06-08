import { describe, expect, it } from "vitest";

import { todayHref } from "./today-href";

describe("todayHref", () => {
  it("should return the bare /today when focus is the real today", () => {
    // Arrange
    const iso = "2026-06-08";

    // Act
    const href = todayHref(iso, iso);

    // Assert
    expect(href).toBe("/today");
  });

  it("should carry ?date= when focus is a different day", () => {
    // Arrange
    const focus = "2026-06-10";
    const realToday = "2026-06-08";

    // Act
    const href = todayHref(focus, realToday);

    // Assert
    expect(href).toBe("/today?date=2026-06-10");
  });
});
