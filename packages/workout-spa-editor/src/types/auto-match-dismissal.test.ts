import { describe, expect, it } from "vitest";

import {
  type AutoMatchDismissal,
  autoMatchDismissalSchema,
} from "./auto-match-dismissal";

const baseRow = (
  overrides: Partial<AutoMatchDismissal> = {}
): AutoMatchDismissal => ({
  profileId: "p1",
  weekStart: "2026-04-27",
  dismissedPairs: [
    {
      activityId: "a1",
      workoutId: "w1",
      dismissedAt: "2026-05-01T12:00:00.000Z",
    },
  ],
  ...overrides,
});

describe("autoMatchDismissalSchema", () => {
  it("should accept a well-formed row", () => {
    expect(autoMatchDismissalSchema.parse(baseRow())).toEqual(baseRow());
  });

  it("should accept a row with an empty dismissedPairs array", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ dismissedPairs: [] }))
    ).not.toThrow();
  });

  it("should require non-empty profileId", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(baseRow({ profileId: "" }))
    ).toThrow();
  });

  it("should require weekStart to match YYYY-MM-DD", () => {
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

  it("should require every dismissedPairs entry to be a well-formed pair", () => {
    expect(() =>
      autoMatchDismissalSchema.parse(
        baseRow({
          dismissedPairs: [
            {
              activityId: "",
              workoutId: "w1",
              dismissedAt: "2026-05-01T12:00:00.000Z",
            },
          ],
        })
      )
    ).toThrow();
    expect(() =>
      autoMatchDismissalSchema.parse(
        baseRow({
          dismissedPairs: [
            {
              activityId: "a1",
              workoutId: "w1",
              dismissedAt: "today",
            },
          ],
        })
      )
    ).toThrow();
  });
});
