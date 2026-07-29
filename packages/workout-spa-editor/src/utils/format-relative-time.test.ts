/**
 * Tests for `formatRelativeTime` — exhaustive coverage of the branches
 * defined in design D17. Asserts on the returned translation key + params
 * (not a formatted string), since wording now lives in the i18n catalogs.
 * `now` is injected so no fake timers are needed.
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
const DAYS_TEN = 10;
const MINUTES_ONE = 1;
const MINUTES_FIVE = 5;
const MINUTES_FIFTY_NINE = 59;
const HOURS_ONE = 1;
const HOURS_TWELVE = 12;
const HOURS_TWENTY_THREE = 23;

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
  it("should return the never-synced key when date is undefined", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(undefined, NOW)).toEqual({
      key: "relativeTime.neverSynced",
    });
  });

  it("should return the just-now key under one minute", () => {
    // Arrange

    // Act

    // Assert
    expect(
      formatRelativeTime(new Date(NOW.getTime() - HALF_MINUTE_MS), NOW)
    ).toEqual({ key: "relativeTime.justNow" });
    expect(
      formatRelativeTime(new Date(NOW.getTime() - ALMOST_ONE_MINUTE_MS), NOW)
    ).toEqual({ key: "relativeTime.justNow" });
  });

  it("should return the minutes-ago key between 1 minute and 1 hour, singular vs plural", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(minutesAgo(MINUTES_ONE), NOW)).toEqual({
      key: "relativeTime.minutesAgo_one",
      params: { count: 1 },
    });
    expect(formatRelativeTime(minutesAgo(MINUTES_FIVE), NOW)).toEqual({
      key: "relativeTime.minutesAgo_other",
      params: { count: 5 },
    });
    expect(formatRelativeTime(minutesAgo(MINUTES_FIFTY_NINE), NOW)).toEqual({
      key: "relativeTime.minutesAgo_other",
      params: { count: 59 },
    });
  });

  it("should return the hours-ago key between 1 hour and 1 day, singular vs plural", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(hoursAgo(HOURS_ONE), NOW)).toEqual({
      key: "relativeTime.hoursAgo_one",
      params: { count: 1 },
    });
    expect(formatRelativeTime(hoursAgo(HOURS_TWELVE), NOW)).toEqual({
      key: "relativeTime.hoursAgo_other",
      params: { count: 12 },
    });
    expect(formatRelativeTime(hoursAgo(HOURS_TWENTY_THREE), NOW)).toEqual({
      key: "relativeTime.hoursAgo_other",
      params: { count: 23 },
    });
  });

  it("should return the yesterday key for cross-day differences under 48h", () => {
    // 30h ago crosses a calendar boundary AND is under 48h.
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(hoursAgo(HOURS_NEAR_TWO_DAYS), NOW)).toEqual({
      key: "relativeTime.yesterday",
    });
  });

  it("should not return the yesterday key when ≥48h has elapsed even if calendar diff is 1", () => {
    // Exactly 2 days back — falls into the days-ago branch.
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(daysAgo(DAYS_TWO), NOW)).toEqual({
      key: "relativeTime.daysAgo_other",
      params: { count: 2 },
    });
  });

  it("should return the days-ago key between 2 days and 1 week", () => {
    // Arrange

    // Act

    // Assert
    expect(formatRelativeTime(daysAgo(DAYS_THREE), NOW)).toEqual({
      key: "relativeTime.daysAgo_other",
      params: { count: 3 },
    });
    expect(formatRelativeTime(daysAgo(DAYS_SIX), NOW)).toEqual({
      key: "relativeTime.daysAgo_other",
      params: { count: 6 },
    });
  });

  it("should return the since key with a non-ISO, locale-formatted date for anything ≥ 1 week", () => {
    // Arrange
    const stamp = daysAgo(DAYS_TEN);

    // Act
    const result = formatRelativeTime(stamp, NOW, "en");

    // Assert
    expect(result.key).toBe("relativeTime.since");
    expect(result.params?.date).toBe(
      stamp.toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    expect(result.params?.date).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should localize the since date for es differently than en (genuine localization, not a relabeled ISO string)", () => {
    // Arrange
    const stamp = daysAgo(DAYS_TEN);

    // Act
    const enResult = formatRelativeTime(stamp, NOW, "en");
    const esResult = formatRelativeTime(stamp, NOW, "es");

    // Assert
    expect(esResult.params?.date).not.toBe(enResult.params?.date);
    expect(esResult.params?.date).toMatch(/de/);
    expect(esResult.params?.date).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
