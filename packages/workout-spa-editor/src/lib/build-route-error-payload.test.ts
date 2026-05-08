import type { ErrorInfo } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const MESSAGE_INPUT_LENGTH = 600;
const MESSAGE_MAX_LENGTH = 500;
const STACK_INPUT_LENGTH = 1100;
const STACK_MAX_LENGTH = 1000;
const STACK_LINE_COUNT = 4;

import { buildRouteErrorPayload } from "./build-route-error-payload";
import { scrubAnalyticsString } from "./scrub-analytics-string";

const ORIGINAL_PATHNAME = window.location.pathname;

function setPath(path: string): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, pathname: path },
  });
}

describe("buildRouteErrorPayload", () => {
  beforeEach(() => {
    setPath("/calendar");
  });

  afterEach(() => {
    setPath(ORIGINAL_PATHNAME);
  });

  describe("route", () => {
    it("should use window.location.pathname", () => {
      // Arrange
      setPath("/calendar/2026-W18");

      // Act
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.route).toBe("/calendar/2026-W18");
    });

    it("should scrub UUIDs in the route", () => {
      // Arrange
      setPath("/workout/6e3ad6f0-1234-4cdf-9abc-1234567890ab");

      // Act
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.route).toBe("/workout/<uuid>");
    });
  });

  describe("name", () => {
    it("should use error.name", () => {
      // Arrange
      const err = new Error("x");
      err.name = "TypeError";

      // Act
      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.name).toBe("TypeError");
    });

    it("should fall back to 'Error' when name is empty", () => {
      // Arrange
      const err = new Error("x");
      err.name = "";

      // Act
      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.name).toBe("Error");
    });
  });

  describe("message", () => {
    it("should scrub UUID in the message", () => {
      // Arrange

      // Act
      const out = buildRouteErrorPayload(
        new Error("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.message).toBe("not found: <uuid>");
    });

    it("should fall back to empty string when message is undefined", () => {
      // Arrange
      const err = new Error();

      // Act
      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.message).toBe("");
    });

    it("should truncate a 600-char message to exactly 500 chars", () => {
      // Arrange

      // Act
      const out = buildRouteErrorPayload(
        new Error(".".repeat(MESSAGE_INPUT_LENGTH)),
        { componentStack: "" },
        scrubAnalyticsString
      );

      // Assert
      expect(out.message.length).toBe(MESSAGE_MAX_LENGTH);
    });
  });

  describe("componentStack", () => {
    it("should scrub a multi-line stack with embedded UUID", () => {
      // Arrange
      const stack = [
        "    in CoachingActivityDialog",
        "    in DialogContent (id=6e3ad6f0-1234-4cdf-9abc-1234567890ab)",
        "    in CalendarPage",
        "    in App",
      ].join("\n");

      // Act
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: stack },
        scrubAnalyticsString
      );

      // Assert
      expect(out.componentStack).toContain("<uuid>");
      expect(out.componentStack.split("\n")).toHaveLength(STACK_LINE_COUNT);
    });

    it("should fall back to empty string when componentStack is undefined", () => {
      // Arrange

      // Act
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: undefined as unknown as string },
        scrubAnalyticsString
      );

      // Assert
      expect(out.componentStack).toBe("");
    });

    it("should truncate a 1100-char componentStack to exactly 1000 chars", () => {
      // Arrange

      // Act
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: ".".repeat(STACK_INPUT_LENGTH) },
        scrubAnalyticsString
      );

      // Assert
      expect(out.componentStack.length).toBe(STACK_MAX_LENGTH);
    });
  });

  it("should return all four fields with safe defaults for an empty error", () => {
    // Arrange
    const err = new Error();
    err.name = "";

    // Act
    const out = buildRouteErrorPayload(
      err,
      { componentStack: "" } as ErrorInfo,
      scrubAnalyticsString
    );

    // Assert
    expect(out).toEqual({
      route: "/calendar",
      name: "Error",
      message: "",
      componentStack: "",
    });
  });
});
