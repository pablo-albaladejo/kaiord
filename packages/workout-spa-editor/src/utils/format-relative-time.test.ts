/**
 * Tests for `formatRelativeTime` — exhaustive coverage of the seven
 * branches defined in design D17. `now` is injected so no fake timers
 * are needed.
 */

import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./format-relative-time";

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const HALF_MINUTE_MS = 30_000;
const ALMOST_ONE_MINUTE_MS = 59_999;
const HOURS_NEAR_TWO_DAYS = 30;
const DAYS_TWO = 2;
const DAYS_THREE = 3;
const DAYS_SIX = 6;
const DAYS_EIGHT = 8;
const DAYS_TEN = 10;
const DAYS_THIRTY = 30;
const MINUTES_ONE = 1;
const MINUTES_FIVE = 5;
const MINUTES_FIFTY_NINE = 59;
const HOURS_ONE = 1;
const HOURS_TWELVE = 12;
const HOURS_TWENTY_THREE = 23;
const PADDING_MIN_LENGTH = 2;
const ISO_MONTH_OFFSET = 1;

const NOW = new Date("2026-05-04T12:00:00.000Z");

const minutesAgo = (n: number): Date =>
  new Date(NOW.getTime() - n * SECONDS_PER_MINUTE * MILLIS_PER_SECOND);
const hoursAgo = (n: number): Date =>
  new Date(
    NOW.getTime() -
      n * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLIS_PER_SECOND
  );
const daysAgo = (n: number): Date =>
  new Date(
    NOW.getTime() -
      n *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MILLIS_PER_SECOND
  );

describe("formatRelativeTime", () => {
  it("should return 'never synced' when date is undefined", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(undefined, NOW)).toBe("never synced");
  });

  it("should return 'just now' under one minute", () => {
    // Arrange

    // Act

    // Assert
    expect(
      formatRelativeTime(new Date(NOW.getTime() - HALF_MINUTE_MS), NOW)
    ).toBe("just now");
    expect(
      formatRelativeTime(new Date(NOW.getTime() - ALMOST_ONE_MINUTE_MS), NOW)
    ).toBe("just now");
  });

  it("should return 'Nm ago' between 1 minute and 1 hour", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(minutesAgo(MINUTES_ONE), NOW)).toBe("1m ago");
    expect(formatRelativeTime(minutesAgo(MINUTES_FIVE), NOW)).toBe("5m ago");
    expect(formatRelativeTime(minutesAgo(MINUTES_FIFTY_NINE), NOW)).toBe(
      "59m ago"
    );
  });

  it("should return 'Nh ago' between 1 hour and 1 day", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(hoursAgo(HOURS_ONE), NOW)).toBe("1h ago");
    expect(formatRelativeTime(hoursAgo(HOURS_TWELVE), NOW)).toBe("12h ago");
    expect(formatRelativeTime(hoursAgo(HOURS_TWENTY_THREE), NOW)).toBe(
      "23h ago"
    );
  });

  it("should return 'yesterday' for cross-day differences under 48h", () => {
    // 30h ago crosses a calendar boundary AND is under 48h.
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(hoursAgo(HOURS_NEAR_TWO_DAYS), NOW)).toBe(
      "yesterday"
    );
  });

  it("should not return 'yesterday' when ≥48h has elapsed even if calendar diff is 1", () => {
    // Exactly 2 days back — falls into the days-ago branch.
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(daysAgo(DAYS_TWO), NOW)).toBe("2d ago");
  });

  it("should return 'Nd ago' between 2 days and 1 week", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(daysAgo(DAYS_THREE), NOW)).toBe("3d ago");
    expect(formatRelativeTime(daysAgo(DAYS_SIX), NOW)).toBe("6d ago");
  });

  it("should return ISO YYYY-MM-DD for anything ≥ 1 week", () => {
    // Arrange

    // Act

    const eightDays = daysAgo(DAYS_EIGHT);

    // Assert

    expect(formatRelativeTime(eightDays, NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatRelativeTime(daysAgo(DAYS_THIRTY), NOW)).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });

  it("should format the ISO fallback in local-calendar form (matches the date's components)", () => {
    // Arrange

    const stamp = daysAgo(DAYS_TEN);

    // Act

    const expected = `${stamp.getFullYear()}-${String(
      stamp.getMonth() + ISO_MONTH_OFFSET
    ).padStart(PADDING_MIN_LENGTH, "0")}-${String(stamp.getDate()).padStart(
      PADDING_MIN_LENGTH,
      "0"
    )}`;

    // Assert

    expect(formatRelativeTime(stamp, NOW)).toBe(expected);
  });
});
