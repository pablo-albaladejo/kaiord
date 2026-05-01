import { describe, expect, it } from "vitest";

import {
  autoMatchDismissalSchema,
  type AutoMatchDismissal,
} from "./auto-match-dismissal";

const baseRow = (
  overrides: Partial<AutoMatchDismissal> = {}
): AutoMatchDismissal => ({
  profileId: "p1",
  weekStart: "2026-04-27",
  dismissedAt: "2026-05-01T12:00:00.000Z",
  ...overrides,
});

describe("autoMatchDismissalSchema", () => {
  it("accepts a well-formed row", () => {
    expect(autoMatchDismissalSchema.parse(baseRow())).toEqual(baseRow());
  });

  it("requires non-empty profileId", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ profileId: "" }))
    ).toThrow();
  });

  it("requires weekStart to match YYYY-MM-DD", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ weekStart: "2026-13-01" }))
    ).not.toThrow(); // regex permits the format; semantic week-Monday check is enforced upstream
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ weekStart: "not-a-date" }))
    ).toThrow();
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ weekStart: "2026-04-27T00:00" }))
    ).toThrow();
  });

  it("requires dismissedAt to be ISO datetime", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ dismissedAt: "today" }))
    ).toThrow();
  });
});
