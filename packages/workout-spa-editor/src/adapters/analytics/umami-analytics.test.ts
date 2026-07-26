import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UmamiPayloadModifier } from "../../types/umami";
import { createUmamiAnalytics } from "./umami-analytics";

describe("createUmamiAnalytics", () => {
  describe("when website id is falsy", () => {
    it.each([
      { label: "undefined", websiteId: undefined },
      { label: "empty string", websiteId: "" },
    ])("should return noop on $label website id", ({ websiteId }) => {
      // Arrange

      // Act
      const analytics = createUmamiAnalytics(websiteId);

      // Assert
      expect(() => analytics.pageView("/")).not.toThrow();
      expect(() => analytics.event("test")).not.toThrow();
    });
  });

  describe("when website id is set", () => {
    const track = vi.fn();

    beforeEach(() => {
      Object.defineProperty(window, "umami", {
        value: { track },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
      delete (window as unknown as Record<string, unknown>).umami;
    });

    it("should forward events to umami.track", () => {
      // Arrange
      const analytics = createUmamiAnalytics("test-website-id");

      // Act
      analytics.event("workout-generated", {
        provider: "claude",
        sport: "cycling",
      });

      // Assert
      expect(track).toHaveBeenCalledWith("workout-generated", {
        provider: "claude",
        sport: "cycling",
      });
    });

    it("should track page views via the payload-modifier form", () => {
      // Arrange
      const analytics = createUmamiAnalytics("test-website-id");

      // Act
      analytics.pageView("/calendar");

      // Assert
      expect(track).toHaveBeenCalledTimes(1);
      const modifier = track.mock.calls[0][0] as UmamiPayloadModifier;
      expect(typeof modifier).toBe("function");
      expect(modifier({ url: "/stale", title: "Kaiord" })).toEqual({
        url: "/calendar",
        title: "Kaiord",
      });
    });

    it("should not throw when the tracker is absent", () => {
      // Arrange
      delete (window as unknown as Record<string, unknown>).umami;

      // Act
      const analytics = createUmamiAnalytics("test-website-id");

      // Assert
      expect(() => analytics.event("editor-loaded")).not.toThrow();
    });

    it("should not throw when track throws", () => {
      // Arrange
      track.mockImplementation(() => {
        throw new Error("tracker error");
      });

      // Act
      const analytics = createUmamiAnalytics("test-website-id");

      // Assert
      expect(() =>
        analytics.event("garmin-synced", { result: "success" })
      ).not.toThrow();
    });
  });
});
