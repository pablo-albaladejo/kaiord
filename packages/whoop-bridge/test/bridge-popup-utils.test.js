import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { applySubs, msg, relativeAgo } = require("../bridge-popup-utils.js");

const NOW_MS = new Date("2026-05-02T10:00:00Z").getTime();

describe("bridge-popup-utils (vendored)", () => {
  beforeEach(() => {
    globalThis.__resetChromeMock();
    globalThis.KAIORD_POPUP_MESSAGES = {
      greeting: "Hello $1",
      minuteAgo: "$1 minute ago",
      minutesAgo: "$1 minutes ago",
      hourAgo: "$1 hour ago",
      hoursAgo: "$1 hours ago",
      dayAgo: "$1 day ago",
      daysAgo: "$1 days ago",
    };
  });

  afterEach(() => {
    delete globalThis.KAIORD_POPUP_MESSAGES;
  });

  describe("applySubs", () => {
    it("should substitute positional $n tokens", () => {
      // Arrange
      const template = "Coach · $1 ($2)";

      // Act
      const out = applySubs(template, ["Ana", "cycling"]);

      // Assert
      expect(out).toBe("Coach · Ana (cycling)");
    });

    it("should return the template untouched when subs are null", () => {
      // Arrange
      const template = "Static text";

      // Act
      const out = applySubs(template, null);

      // Assert
      expect(out).toBe("Static text");
    });

    it("should blank out-of-range placeholders", () => {
      // Arrange
      const template = "Value $2";

      // Act
      const out = applySubs(template, ["only-one"]);

      // Assert
      expect(out).toBe("Value ");
    });
  });

  describe("msg", () => {
    it("should prefer chrome.i18n.getMessage when it yields a string", () => {
      // Arrange
      chrome.i18n = { getMessage: vi.fn(() => "Hola") };

      // Act
      const out = msg("greeting", ["x"]);

      // Assert
      expect(out).toBe("Hola");
      delete chrome.i18n;
    });

    it("should fall back to the per-bridge table when chrome.i18n is absent", () => {
      // Arrange

      // Act
      const out = msg("greeting", ["Ana"]);

      // Assert
      expect(out).toBe("Hello Ana");
    });
  });

  describe("relativeAgo", () => {
    let originalNow;

    beforeEach(() => {
      originalNow = Date.now;
      Date.now = () => NOW_MS;
    });

    afterEach(() => {
      Date.now = originalNow;
    });

    it("should return null under one minute", () => {
      // Arrange
      const epoch = NOW_MS - 30_000;

      // Act
      const out = relativeAgo(epoch);

      // Assert
      expect(out).toBeNull();
    });

    it.each([
      { delta: 60_000, expected: "1 minute ago" },
      { delta: 5 * 60_000, expected: "5 minutes ago" },
      { delta: 60 * 60_000, expected: "1 hour ago" },
      { delta: 3 * 60 * 60_000, expected: "3 hours ago" },
      { delta: 24 * 60 * 60_000, expected: "1 day ago" },
      { delta: 9 * 24 * 60 * 60_000, expected: "9 days ago" },
    ])("should bucket $expected", ({ delta, expected }) => {
      // Arrange
      const epoch = NOW_MS - delta;

      // Act
      const out = relativeAgo(epoch);

      // Assert
      expect(out).toBe(expected);
    });
  });
});
