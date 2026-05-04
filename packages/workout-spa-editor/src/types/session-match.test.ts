import { describe, expect, it } from "vitest";

import {
  type SessionMatch,
  sessionMatchSchema,
  sessionMatchSourceSchema,
} from "./session-match";

const baseRow = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "M1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:12345",
  workoutId: "w-abc",
  date: "2026-04-29",
  createdAt: "2026-05-01T12:00:00.000Z",
  source: "manual",
  ...overrides,
});

describe("sessionMatchSourceSchema", () => {
  it("accepts the three documented provenance values", () => {
    expect(sessionMatchSourceSchema.parse("manual")).toBe("manual");
    expect(sessionMatchSourceSchema.parse("auto-suggestion")).toBe(
      "auto-suggestion"
    );
    expect(sessionMatchSourceSchema.parse("auto-conversion")).toBe(
      "auto-conversion"
    );
  });

  it("rejects any other value", () => {
    expect(() => sessionMatchSourceSchema.parse("auto")).toThrow();
    expect(() => sessionMatchSourceSchema.parse("system")).toThrow();
    expect(() => sessionMatchSourceSchema.parse("")).toThrow();
  });
});

describe("sessionMatchSchema", () => {
  it("accepts a well-formed row with each provenance value", () => {
    expect(sessionMatchSchema.parse(baseRow({ source: "manual" })).source).toBe(
      "manual"
    );
    expect(
      sessionMatchSchema.parse(baseRow({ source: "auto-suggestion" })).source
    ).toBe("auto-suggestion");
    expect(
      sessionMatchSchema.parse(baseRow({ source: "auto-conversion" })).source
    ).toBe("auto-conversion");
  });

  it("requires non-empty id, profileId, coachingActivityId, workoutId", () => {
    expect(() => sessionMatchSchema.parse(baseRow({ id: "" }))).toThrow();
    expect(() =>
      sessionMatchSchema.parse(baseRow({ profileId: "" }))
    ).toThrow();
    expect(() =>
      sessionMatchSchema.parse(baseRow({ coachingActivityId: "" }))
    ).toThrow();
    expect(() =>
      sessionMatchSchema.parse(baseRow({ workoutId: "" }))
    ).toThrow();
  });

  it("requires createdAt to be ISO datetime", () => {
    expect(() =>
      sessionMatchSchema.parse(baseRow({ createdAt: "not-a-date" }))
    ).toThrow();
    expect(() =>
      sessionMatchSchema.parse(baseRow({ createdAt: "2026-05-01" }))
    ).toThrow();
  });

  it("requires date to match YYYY-MM-DD", () => {
    expect(() => sessionMatchSchema.parse(baseRow({ date: "2026" }))).toThrow();
    expect(() =>
      sessionMatchSchema.parse(baseRow({ date: "2026-04-29T00:00" }))
    ).toThrow();
  });

  it("rejects unknown source values", () => {
    expect(() =>
      // @ts-expect-error — verifying runtime rejection of disallowed literal
      sessionMatchSchema.parse(baseRow({ source: "auto" }))
    ).toThrow();
  });
});
