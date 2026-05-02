/**
 * Tests for `formatRelativeTime` — exhaustive coverage of the seven
 * branches defined in design D17. `now` is injected so no fake timers
 * are needed.
 */

import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./format-relative-time";

const NOW = new Date("2026-05-04T12:00:00.000Z");

const minutesAgo = (n: number): Date => new Date(NOW.getTime() - n * 60 * 1000);
const hoursAgo = (n: number): Date =>
  new Date(NOW.getTime() - n * 60 * 60 * 1000);
const daysAgo = (n: number): Date =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("formatRelativeTime", () => {
  it("returns 'never synced' when date is undefined", () => {
    expect(formatRelativeTime(undefined, NOW)).toBe("never synced");
  });

  it("returns 'just now' under one minute", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 30_000), NOW)).toBe(
      "just now"
    );
    expect(formatRelativeTime(new Date(NOW.getTime() - 59_999), NOW)).toBe(
      "just now"
    );
  });

  it("returns 'Nm ago' between 1 minute and 1 hour", () => {
    expect(formatRelativeTime(minutesAgo(1), NOW)).toBe("1m ago");
    expect(formatRelativeTime(minutesAgo(5), NOW)).toBe("5m ago");
    expect(formatRelativeTime(minutesAgo(59), NOW)).toBe("59m ago");
  });

  it("returns 'Nh ago' between 1 hour and 1 day", () => {
    expect(formatRelativeTime(hoursAgo(1), NOW)).toBe("1h ago");
    expect(formatRelativeTime(hoursAgo(12), NOW)).toBe("12h ago");
    expect(formatRelativeTime(hoursAgo(23), NOW)).toBe("23h ago");
  });

  it("returns 'yesterday' for cross-day differences under 48h", () => {
    // 30h ago crosses a calendar boundary AND is under 48h.
    expect(formatRelativeTime(hoursAgo(30), NOW)).toBe("yesterday");
  });

  it("does NOT return 'yesterday' when ≥48h has elapsed even if calendar diff is 1", () => {
    // Exactly 2 days back — falls into the days-ago branch.
    expect(formatRelativeTime(daysAgo(2), NOW)).toBe("2d ago");
  });

  it("returns 'Nd ago' between 2 days and 1 week", () => {
    expect(formatRelativeTime(daysAgo(3), NOW)).toBe("3d ago");
    expect(formatRelativeTime(daysAgo(6), NOW)).toBe("6d ago");
  });

  it("returns ISO YYYY-MM-DD for anything ≥ 1 week", () => {
    const eightDays = daysAgo(8);
    expect(formatRelativeTime(eightDays, NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatRelativeTime(daysAgo(30), NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats the ISO fallback in local-calendar form (matches the date's components)", () => {
    const stamp = daysAgo(10);
    const expected = `${stamp.getFullYear()}-${String(
      stamp.getMonth() + 1
    ).padStart(2, "0")}-${String(stamp.getDate()).padStart(2, "0")}`;
    expect(formatRelativeTime(stamp, NOW)).toBe(expected);
  });
});
