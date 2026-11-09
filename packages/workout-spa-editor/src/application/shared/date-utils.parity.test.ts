import { describe, expect, it } from "vitest";

import {
  addDaysIso as dailyAddDaysIso,
  isoToLocalDate,
  weekDays,
} from "../../components/pages/Daily/today-dates";
import { weekDatesFrom } from "../energy/week-dates";
import { addDaysIso } from "./date-utils";

// Spring-forward and fall-back days in the EU and US, month and year ends, a
// leap day, and the day after a non-leap February.
const DATES = [
  "2026-03-08",
  "2026-03-29",
  "2026-10-25",
  "2026-11-01",
  "2026-01-31",
  "2026-04-30",
  "2026-12-31",
  "2024-02-28",
  "2024-02-29",
  "2026-02-28",
];
const WEEK = 7;
const MONTH = 31;
const OVER_A_YEAR = 400;
const DELTAS = [
  -OVER_A_YEAR,
  -MONTH,
  -WEEK,
  -1,
  0,
  1,
  WEEK,
  MONTH,
  OVER_A_YEAR,
];

describe("addDaysIso parity", () => {
  it.each(DATES)(
    "should match the Daily page helper for every delta from %s",
    (iso) => {
      // Arrange
      const expected = DELTAS.map((delta) => dailyAddDaysIso(iso, delta));

      // Act
      const actual = DELTAS.map((delta) => addDaysIso(iso, delta));

      // Assert
      expect(actual).toEqual(expected);
    }
  );

  it("should cross DST and month ends on the calendar day", () => {
    // Arrange
    const cases: Array<[string, number, string]> = [
      ["2026-03-28", 1, "2026-03-29"],
      ["2026-03-29", 1, "2026-03-30"],
      ["2026-10-24", 2, "2026-10-26"],
      ["2026-03-07", 2, "2026-03-09"],
      ["2026-01-31", 1, "2026-02-01"],
      ["2024-02-28", 1, "2024-02-29"],
      ["2026-02-28", 1, "2026-03-01"],
      ["2026-12-31", 1, "2027-01-01"],
      ["2026-03-01", -1, "2026-02-28"],
    ];

    // Act
    const actual = cases.map(([iso, delta]) => addDaysIso(iso, delta));

    // Assert
    expect(actual).toEqual(cases.map(([, , expected]) => expected));
  });

  it("should return NaN parts for a malformed date instead of throwing", () => {
    // Arrange
    const malformed = "bad";

    // Act
    const actual = addDaysIso(malformed, 1);

    // Assert: the year is zero-padded to four characters, so "NaN" gains a 0
    expect(actual).toBe("0NaN-NaN-NaN");
  });

  it.each(DATES)(
    "should resolve the same Monday-to-Sunday week as the Daily page for %s",
    (iso) => {
      // Arrange
      const expected = weekDays(isoToLocalDate(iso), "").map((d) => d.iso);

      // Act
      const actual = weekDatesFrom(iso);

      // Assert
      expect(actual).toEqual(expected);
    }
  );
});
