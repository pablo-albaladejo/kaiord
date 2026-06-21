import { describe, expect, it } from "vitest";

import { dailyHref } from "./daily-href";

describe("dailyHref", () => {
  it("should return the bare /daily when focus is the real today", () => {
    // Arrange
    const iso = "2026-06-08";

    // Act
    const href = dailyHref(iso, iso);

    // Assert
    expect(href).toBe("/daily");
  });

  it("should carry ?date= when focus is a different day", () => {
    // Arrange
    const focus = "2026-06-10";
    const realToday = "2026-06-08";

    // Act
    const href = dailyHref(focus, realToday);

    // Assert
    expect(href).toBe("/daily?date=2026-06-10");
  });
});
