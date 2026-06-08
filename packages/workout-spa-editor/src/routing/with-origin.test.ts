import { describe, expect, it } from "vitest";

import { withOrigin } from "./with-origin";

describe("withOrigin", () => {
  it("should append from= to a bare href", () => {
    // Arrange
    const href = "/workout/new";

    // Act
    const result = withOrigin(href, "calendar");

    // Assert
    expect(result).toBe("/workout/new?from=calendar");
  });

  it("should preserve an existing source param", () => {
    // Arrange
    const href = "/workout/new?source=scratch";

    // Act
    const result = withOrigin(href, "library");

    // Assert
    expect(result).toBe("/workout/new?source=scratch&from=library");
  });

  it("should preserve an existing date param", () => {
    // Arrange
    const href = "/workout/new?date=2026-06-01";

    // Act
    const result = withOrigin(href, "calendar-day");

    // Assert
    expect(result).toBe("/workout/new?date=2026-06-01&from=calendar-day");
  });

  it("should append the focused day via the date option", () => {
    // Arrange
    const href = "/workout/abc";

    // Act
    const result = withOrigin(href, "today", { date: "2026-06-10" });

    // Assert
    expect(result).toBe("/workout/abc?from=today&date=2026-06-10");
  });

  it("should be idempotent when applied twice", () => {
    // Arrange
    const once = withOrigin("/workout/new?source=scratch", "library");

    // Act
    const twice = withOrigin(once, "library");

    // Assert
    expect(twice).toBe("/workout/new?source=scratch&from=library");
  });
});
