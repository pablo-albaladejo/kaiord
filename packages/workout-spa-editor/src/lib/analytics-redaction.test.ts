import { describe, expect, it } from "vitest";

import {
  redactAnalyticsPath,
  scrubEventProps,
  UNKNOWN_PATH,
} from "./analytics-redaction";

const UUID = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";

describe("redactAnalyticsPath", () => {
  it.each([
    { path: `/workout/${UUID}`, expected: "/workout/:id" },
    { path: "/workout/abc123", expected: "/workout/:id" },
    { path: `/workout/view/${UUID}`, expected: "/workout/view/:id" },
    { path: `/chat/${UUID}`, expected: "/chat/:conversationId" },
    { path: `/workout/${UUID}?origin=coaching`, expected: "/workout/:id" },
    { path: `/workout/${UUID}/`, expected: "/workout/:id" },
    { path: "/calendar/alice@example.com", expected: "/calendar/:weekId" },
    { path: "/settings/alice@example.com", expected: "/settings/:section" },
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
    "/settings/profile",
    "/health",
    "/daily",
    "/",
  ])("should keep %s unchanged and base-relative", (path) => {
    // Arrange

    // Act
    const result = redactAnalyticsPath(path);

    // Assert
    expect(result).toBe(path);
  });
});

describe("redactAnalyticsPath on paths outside the route table", () => {
  it.each([
    "/other/alice@example.com",
    "/alice@example.com",
    "/health/alice@example.com",
    `/${UUID}/settings`,
  ])("should collapse %s to the unknown marker", (path) => {
    // Arrange

    // Act
    const result = redactAnalyticsPath(path);

    // Assert
    expect(result).toBe(UNKNOWN_PATH);
    expect(result).not.toContain("alice");
  });
});

describe("scrubEventProps", () => {
  it("should drop profileId and keep every other field", () => {
    // Arrange
    const props = { source: "train2go", profileId: "p1", durationMs: 12 };

    // Act
    const result = scrubEventProps(props);

    // Assert
    expect(result).toEqual({ source: "train2go", durationMs: 12 });
  });

  it("should scrub PII out of string values and leave other types alone", () => {
    // Arrange
    const props = {
      source: "alice@example.com",
      reason: `failed for ${UUID}`,
      count: 3,
      ok: true,
    };

    // Act
    const result = scrubEventProps(props);

    // Assert
    expect(result).toEqual({
      source: "<email>",
      reason: "failed for <uuid>",
      count: 3,
      ok: true,
    });
  });

  it("should pass an absent payload through", () => {
    // Arrange

    // Act
    const result = scrubEventProps(undefined);

    // Assert
    expect(result).toBeUndefined();
  });
});
