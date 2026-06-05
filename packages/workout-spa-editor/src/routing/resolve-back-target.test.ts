import { describe, expect, it } from "vitest";

import { resolveBackTarget } from "./resolve-back-target";

describe("resolveBackTarget", () => {
  it("should resolve the library origin to /library", () => {
    // Arrange
    const input = { origin: "library" as const };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/library");
  });

  it("should resolve the calendar origin to /calendar", () => {
    // Arrange
    const input = { origin: "calendar" as const };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });

  it("should resolve the coaching origin to /calendar", () => {
    // Arrange
    const input = { origin: "coaching" as const };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });

  it("should resolve the today origin to /calendar", () => {
    // Arrange
    const input = { origin: "today" as const };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });

  it("should resolve a dated calendar-day origin to the picker href", () => {
    // Arrange
    const input = { origin: "calendar-day" as const, date: "2026-06-01" };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/workout/new?date=2026-06-01");
  });

  it("should resolve a calendar-day origin without a date to /calendar", () => {
    // Arrange
    const input = { origin: "calendar-day" as const, date: null };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });

  it("should resolve a detail origin with an id to the detail view", () => {
    // Arrange
    const input = { origin: "detail" as const, detailId: "w1" };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/workout/view/w1");
  });

  it("should resolve a detail origin without an id to /calendar", () => {
    // Arrange
    const input = { origin: "detail" as const, detailId: null };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });

  it("should resolve a null origin to the default /calendar home", () => {
    // Arrange
    const input = { origin: null };

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe("/calendar");
  });
});
