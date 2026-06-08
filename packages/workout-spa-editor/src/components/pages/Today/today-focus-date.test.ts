import { describe, expect, it } from "vitest";

import { isoToLocalDate } from "./today-dates";
import { isRealIso, resolveFocusIso } from "./today-focus-date";

// Week of Mon 2026-06-08 .. Sun 2026-06-14.
const WEEK = [
  "2026-06-08",
  "2026-06-09",
  "2026-06-10",
  "2026-06-11",
  "2026-06-12",
  "2026-06-13",
  "2026-06-14",
];
const REAL_TODAY = "2026-06-08";
const Y = 2026;
const JUN_INDEX = 5;
const FIFTH = 5;

describe("isoToLocalDate", () => {
  it("should build a local date without a UTC day shift", () => {
    // Arrange
    const iso = "2026-06-05";

    // Act
    const date = isoToLocalDate(iso);

    // Assert
    expect(date.getFullYear()).toBe(Y);
    expect(date.getMonth()).toBe(JUN_INDEX);
    expect(date.getDate()).toBe(FIFTH);
  });
});

describe("isRealIso", () => {
  it("should accept a real calendar date", () => {
    // Arrange
    const iso = "2026-06-10";

    // Act
    const ok = isRealIso(iso);

    // Assert
    expect(ok).toBe(true);
  });

  it("should reject malformed or impossible dates", () => {
    // Arrange
    const cases = ["", "2026-6-10", "2026-13-01", "2026-06-40", "nope"];

    // Act
    const results = cases.map(isRealIso);

    // Assert
    expect(results).toEqual([false, false, false, false, false]);
  });
});

describe("resolveFocusIso", () => {
  it("should keep an in-week requested day", () => {
    // Arrange
    const requested = "2026-06-10";

    // Act
    const focus = resolveFocusIso(requested, REAL_TODAY, WEEK);

    // Assert
    expect(focus).toBe("2026-06-10");
  });

  it("should fall back to real today for an out-of-week day", () => {
    // Arrange
    const requested = "2026-06-01";

    // Act
    const focus = resolveFocusIso(requested, REAL_TODAY, WEEK);

    // Assert
    expect(focus).toBe(REAL_TODAY);
  });

  it("should fall back to real today for a malformed param", () => {
    // Arrange
    const requested = "not-a-date";

    // Act
    const focus = resolveFocusIso(requested, REAL_TODAY, WEEK);

    // Assert
    expect(focus).toBe(REAL_TODAY);
  });

  it("should fall back to real today for a missing param", () => {
    // Arrange
    const requested = "";

    // Act
    const focus = resolveFocusIso(requested, REAL_TODAY, WEEK);

    // Assert
    expect(focus).toBe(REAL_TODAY);
  });
});
