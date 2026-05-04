import { describe, expect, it } from "vitest";

import {
  calendarDensitySchema,
  type UserPreferences,
  userPreferencesSchema,
} from "./user-preferences";

const baseRow = (
  overrides: Partial<UserPreferences> = {}
): UserPreferences => ({
  profileId: "p1",
  calendarDensity: "compact",
  updatedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("calendarDensitySchema", () => {
  it("should accept compact and comfortable", () => {
    // Arrange

    // Act

    // Assert
    expect(calendarDensitySchema.parse("compact")).toBe("compact");
    expect(calendarDensitySchema.parse("comfortable")).toBe("comfortable");
  });

  it("should reject any other value", () => {
    // Arrange

    // Act

    // Assert
    expect(() => calendarDensitySchema.parse("dense")).toThrow();
    expect(() => calendarDensitySchema.parse("")).toThrow();
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

  it("should reject unknown density values", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      // @ts-expect-error — verifying runtime rejection
      userPreferencesSchema.parse(baseRow({ calendarDensity: "tight" }))
    ).toThrow();
  });
});
