import { describe, expect, it } from "vitest";

import {
  type ResolveBackInput,
  resolveBackTarget,
} from "./resolve-back-target";

const CASES: { label: string; input: ResolveBackInput; expected: string }[] = [
  {
    label: "the library origin to /library",
    input: { origin: "library" },
    expected: "/library",
  },
  {
    label: "an unweeked calendar origin to bare /calendar",
    input: { origin: "calendar" },
    expected: "/calendar",
  },
  {
    label: "a weeked calendar origin to the originating week",
    input: { origin: "calendar", week: "2026-W15" },
    expected: "/calendar/2026-W15",
  },
  {
    label: "the coaching origin to /calendar",
    input: { origin: "coaching" },
    expected: "/calendar",
  },
  {
    label: "the daily origin to /daily",
    input: { origin: "daily" },
    expected: "/daily",
  },
  {
    label: "a dated daily origin to the focused day",
    input: { origin: "daily", date: "2026-06-10" },
    expected: "/daily?date=2026-06-10",
  },
  {
    label: "a dated calendar-day origin to the picker href",
    input: { origin: "calendar-day", date: "2026-06-01" },
    expected: "/workout/new?date=2026-06-01",
  },
  {
    label: "an undated calendar-day origin to the calendar home",
    input: { origin: "calendar-day", date: null },
    expected: "/calendar",
  },
  {
    label: "a detail origin with an id to the detail view",
    input: { origin: "detail", detailId: "w1" },
    expected: "/workout/view/w1",
  },
  {
    label: "a detail origin without an id to the calendar home",
    input: { origin: "detail", detailId: null },
    expected: "/calendar",
  },
  {
    label: "the chat origin to /chat",
    input: { origin: "chat" },
    expected: "/chat",
  },
  {
    label: "a null origin to the default /calendar home",
    input: { origin: null },
    expected: "/calendar",
  },
];

describe("resolveBackTarget", () => {
  it.each(CASES)("should resolve $label", ({ input, expected }) => {
    // Arrange

    // Act
    const result = resolveBackTarget(input);

    // Assert
    expect(result).toBe(expected);
  });
});
