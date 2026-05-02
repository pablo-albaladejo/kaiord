import type { ErrorInfo } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
    it("uses window.location.pathname", () => {
      setPath("/calendar/2026-W18");

      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.route).toBe("/calendar/2026-W18");
    });

    it("scrubs UUIDs in the route", () => {
      setPath("/workout/6e3ad6f0-1234-4cdf-9abc-1234567890ab");

      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.route).toBe("/workout/<uuid>");
    });
  });

  describe("name", () => {
    it("uses error.name", () => {
      const err = new Error("x");
      err.name = "TypeError";

      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.name).toBe("TypeError");
    });

    it("falls back to 'Error' when name is empty", () => {
      const err = new Error("x");
      err.name = "";

      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.name).toBe("Error");
    });
  });

  describe("message", () => {
    it("scrubs UUID in the message", () => {
      const out = buildRouteErrorPayload(
        new Error("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab"),
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.message).toBe("not found: <uuid>");
    });

    it("falls back to empty string when message is undefined", () => {
      const err = new Error();

      const out = buildRouteErrorPayload(
        err,
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.message).toBe("");
    });

    it("truncates a 600-char message to exactly 500 chars", () => {
      const out = buildRouteErrorPayload(
        new Error(".".repeat(600)),
        { componentStack: "" },
        scrubAnalyticsString
      );

      expect(out.message.length).toBe(500);
    });
  });

  describe("componentStack", () => {
    it("scrubs a multi-line stack with embedded UUID", () => {
      const stack = [
        "    in CoachingActivityDialog",
        "    in DialogContent (id=6e3ad6f0-1234-4cdf-9abc-1234567890ab)",
        "    in CalendarPage",
        "    in App",
      ].join("\n");

      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: stack },
        scrubAnalyticsString
      );

      expect(out.componentStack).toContain("<uuid>");
      expect(out.componentStack.split("\n")).toHaveLength(4);
    });

    it("falls back to empty string when componentStack is undefined", () => {
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: undefined as unknown as string },
        scrubAnalyticsString
      );

      expect(out.componentStack).toBe("");
    });

    it("truncates a 1100-char componentStack to exactly 1000 chars", () => {
      const out = buildRouteErrorPayload(
        new Error("x"),
        { componentStack: ".".repeat(1100) },
        scrubAnalyticsString
      );

      expect(out.componentStack.length).toBe(1000);
    });
  });

  it("returns all four fields with safe defaults for an empty error", () => {
    const err = new Error();
    err.name = "";

    const out = buildRouteErrorPayload(
      err,
      { componentStack: "" } as ErrorInfo,
      scrubAnalyticsString
    );

    expect(out).toEqual({
      route: "/calendar",
      name: "Error",
      message: "",
      componentStack: "",
    });
  });
});
