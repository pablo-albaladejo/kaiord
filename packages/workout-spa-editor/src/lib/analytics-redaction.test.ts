import { describe, expect, it } from "vitest";

import {
  redactAnalyticsPath,
  stripIdentifyingProps,
} from "./analytics-redaction";

const UUID = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";

describe("redactAnalyticsPath", () => {
  it.each([
    { path: `/workout/${UUID}`, expected: "/workout/:id" },
    { path: "/workout/abc123", expected: "/workout/:id" },
    { path: `/workout/view/${UUID}`, expected: "/workout/view/:id" },
    { path: `/chat/${UUID}`, expected: "/chat/:conversationId" },
    { path: `/workout/${UUID}?origin=coaching`, expected: "/workout/:id" },
  ])("should replace the record id in $path", ({ path, expected }) => {
    // Arrange

    // Act
    const result = redactAnalyticsPath(path);

    // Assert
    expect(result).toBe(expected);
    expect(result).not.toContain(UUID);
  });

  it.each([
    "/calendar",
    "/calendar/2026-W32",
    "/library",
    "/workout/new",
    "/chat",
    "/health/sleep",
    "/settings/privacy",
  ])("should keep %s unchanged and base-relative", (path) => {
    // Arrange

    // Act
    const result = redactAnalyticsPath(path);

    // Assert
    expect(result).toBe(path);
  });
});

describe("stripIdentifyingProps", () => {
  it("should drop profileId and keep every other field", () => {
    // Arrange
    const props = { source: "train2go", profileId: "p1", durationMs: 12 };

    // Act
    const result = stripIdentifyingProps(props);

    // Assert
    expect(result).toEqual({ source: "train2go", durationMs: 12 });
  });

  it("should pass an absent payload through", () => {
    // Arrange

    // Act
    const result = stripIdentifyingProps(undefined);

    // Assert
    expect(result).toBeUndefined();
  });
});
