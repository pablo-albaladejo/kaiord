import { describe, expect, it } from "vitest";

import {
  calendarViewSchema,
  type UserPreferences,
  userPreferencesSchema,
} from "./user-preferences";

const baseRow = (
  overrides: Partial<UserPreferences> = {}
): UserPreferences => ({
  profileId: "p1",
  calendarView: "grid",
  updatedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("calendarViewSchema", () => {
  it("should accept grid and list", () => {
    // Arrange

    // Act

    // Assert
    expect(calendarViewSchema.parse("grid")).toBe("grid");
    expect(calendarViewSchema.parse("list")).toBe("list");
  });

  it("should reject any other value", () => {
    // Arrange

    // Act

    // Assert
    expect(() => calendarViewSchema.parse("compact")).toThrow();
    expect(() => calendarViewSchema.parse("")).toThrow();
  });
});

describe("userPreferencesSchema", () => {
  it("should accept a well-formed row", () => {
    // Arrange

    // Act

    // Assert
    expect(userPreferencesSchema.parse(baseRow())).toEqual(baseRow());
  });

  it("should require non-empty profileId", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      userPreferencesSchema.parse(baseRow({ profileId: "" }))
    ).toThrow();
  });

  it("should require updatedAt to be ISO datetime", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      userPreferencesSchema.parse(baseRow({ updatedAt: "yesterday" }))
    ).toThrow();
  });

  it("should reject unknown view values", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      // @ts-expect-error — verifying runtime rejection
      userPreferencesSchema.parse(baseRow({ calendarView: "tight" }))
    ).toThrow();
  });

  it("should accept a well-formed row with labDashboardParams (F5)", () => {
    // Arrange
    const row = baseRow({ labDashboardParams: ["glucose", "ferritin"] });

    // Act
    const parsed = userPreferencesSchema.parse(row);

    // Assert
    expect(parsed.labDashboardParams).toEqual(["glucose", "ferritin"]);
  });

  it("should accept a row without labDashboardParams — pre-F5 rows stay valid", () => {
    // Arrange
    const row = baseRow();

    // Act
    const parsed = userPreferencesSchema.parse(row);

    // Assert
    expect(parsed.labDashboardParams).toBeUndefined();
  });

  it("should reject a non-string labDashboardParams entry", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      userPreferencesSchema.parse(
        // @ts-expect-error — verifying runtime rejection
        baseRow({ labDashboardParams: [1] })
      )
    ).toThrow();
  });
});
