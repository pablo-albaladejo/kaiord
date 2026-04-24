import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCloudflareAnalytics } from "./cloudflare-analytics";

describe("createCloudflareAnalytics", () => {
  describe("when token is falsy", () => {
    it("should return noop on undefined token", () => {
      // Arrange & Act
      const analytics = createCloudflareAnalytics(undefined);

      // Assert — noop: no throw, no side effects
      expect(() => analytics.pageView("/")).not.toThrow();
      expect(() => analytics.event("test")).not.toThrow();
    });

    it("should return noop on empty string token", () => {
      // Arrange & Act
      const analytics = createCloudflareAnalytics("");

      // Assert
      expect(() => analytics.pageView("/")).not.toThrow();
      expect(() => analytics.event("test")).not.toThrow();
    });
  });

  describe("when token is set", () => {
    const pushEvent = vi.fn();

    beforeEach(() => {
      Object.defineProperty(window, "cfBeacon", {
        value: { pushEvent },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
      delete (window as unknown as Record<string, unknown>).cfBeacon;
    });

    it("should call pushEvent when beacon is available", () => {
      // Arrange
      const analytics = createCloudflareAnalytics("test-token");

      // Act
      analytics.event("workout-generated", {
        provider: "claude",
        sport: "cycling",
      });

      // Assert
      expect(pushEvent).toHaveBeenCalledWith("workout-generated", {
        provider: "claude",
        sport: "cycling",
      });
    });

    it("should call pushEvent for pageView", () => {
      // Arrange
      const analytics = createCloudflareAnalytics("test-token");

      // Act
      analytics.pageView("/editor/");

      // Assert
      expect(pushEvent).toHaveBeenCalledWith("pageView", { path: "/editor/" });
    });

    it("should not throw when beacon is absent", () => {
      // Arrange
      delete (window as unknown as Record<string, unknown>).cfBeacon;
      const analytics = createCloudflareAnalytics("test-token");

      // Act & Assert
      expect(() => analytics.event("editor-opened")).not.toThrow();
    });

    it("should not throw when pushEvent throws", () => {
      // Arrange
      pushEvent.mockImplementation(() => {
        throw new Error("beacon error");
      });
      const analytics = createCloudflareAnalytics("test-token");

      // Act & Assert
      expect(() =>
        analytics.event("garmin-synced", { result: "success" })
      ).not.toThrow();
    });
  });
});
