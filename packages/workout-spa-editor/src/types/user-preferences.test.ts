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
  it("accepts compact and comfortable", () => {
    expect(calendarDensitySchema.parse("compact")).toBe("compact");
    expect(calendarDensitySchema.parse("comfortable")).toBe("comfortable");
  });

  it("rejects any other value", () => {
    expect(() => calendarDensitySchema.parse("dense")).toThrow();
    expect(() => calendarDensitySchema.parse("")).toThrow();
  });
});

describe("userPreferencesSchema", () => {
  it("accepts a well-formed row", () => {
    expect(userPreferencesSchema.parse(baseRow())).toEqual(baseRow());
  });

  it("requires non-empty profileId", () => {
    expect(() =>
      userPreferencesSchema.parse(baseRow({ profileId: "" }))
    ).toThrow();
  });

  it("requires updatedAt to be ISO datetime", () => {
    expect(() =>
      userPreferencesSchema.parse(baseRow({ updatedAt: "yesterday" }))
    ).toThrow();
  });

  it("rejects unknown density values", () => {
    expect(() =>
      // @ts-expect-error — verifying runtime rejection
      userPreferencesSchema.parse(baseRow({ calendarDensity: "tight" }))
    ).toThrow();
  });
});
