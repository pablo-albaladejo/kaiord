// @vitest-environment jsdom
//
// Kaiord Bridge Core — vendored unit tests for bridge-popup-utils.js.
// Master: packages/_shared/bridge-core/test/bridge-popup-utils.test.js. Never
// edit a vendored copy — edit the master and run `pnpm bridge:sync`. Every
// bridge runs this suite against its own vendored utilities copy.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  applySubs,
  msg,
  $,
  withTimeout,
  relativeAgo,
  formatSinceDate,
  renderRetry,
} = require("../bridge-popup-utils.js");

const TIMEOUT_MS = 1_000;

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
      retry: "Try again",
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

  describe("formatSinceDate", () => {
    it("should render day and short month for the current year", () => {
      // Arrange
      const epoch = new Date("2026-04-23T08:00:00Z").getTime();

      // Act
      const out = formatSinceDate(epoch, NOW_MS);

      // Assert
      // Day-first: pinned to en-GB rather than the browser locale, because
      // a US-configured Chrome would otherwise render "Apr 23" into copy the
      // rest of which is written day-first.
      expect(out).toBe("23 Apr");
    });

    it("should append the year when the outage started in an earlier one", () => {
      // Arrange
      const epoch = new Date("2025-12-30T08:00:00Z").getTime();

      // Act
      const out = formatSinceDate(epoch, NOW_MS);

      // Assert
      // Without the year a fourteen-month-old outage reads as this month's.
      expect(out).toBe("30 Dec 2025");
    });

    it("should return null for a stamp that is not a date", () => {
      // Arrange
      const epoch = Number.NaN;

      // Act
      const out = formatSinceDate(epoch, NOW_MS);

      // Assert
      expect(out).toBeNull();
    });
  });

  describe("$", () => {
    it("should resolve an element by id", () => {
      // Arrange
      document.body.innerHTML = '<p id="target">x</p>';

      // Act
      const el = $("target");

      // Assert
      expect(el?.textContent).toBe("x");
    });
  });

  describe("withTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve with the promise value when it settles first", async () => {
      // Arrange
      const promise = Promise.resolve("done");

      // Act
      const out = await withTimeout(promise, TIMEOUT_MS, "probe");

      // Assert
      expect(out).toBe("done");
    });

    it("should reject with the labelled timeout when the promise stalls", async () => {
      // Arrange
      const stalled = new Promise(() => {});
      const raced = withTimeout(stalled, TIMEOUT_MS, "probe");
      const assertion = expect(raced).rejects.toThrow("probe timeout");

      // Act
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

      // Assert
      await assertion;
    });
  });

  describe("renderRetry", () => {
    beforeEach(() => {
      document.body.innerHTML =
        '<button id="refresh-btn" type="button"></button><div id="footer-region"></div>';
    });

    it("should append a labelled retry button that runs the handler", () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      renderRetry(onClick);
      $("retry-btn").click();

      // Assert
      const btn = $("retry-btn");
      expect(btn.parentElement?.id).toBe("footer-region");
      expect(btn.type).toBe("button");
      expect(btn.className).toBe("cta-retry");
      expect(btn.textContent).toBe("Try again");
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should take focus when nothing else holds it", () => {
      // Arrange
      document.body.focus();

      // Act
      renderRetry(() => {});

      // Assert
      expect(document.activeElement?.id).toBe("retry-btn");
    });

    it("should leave focus on the element that already holds it", () => {
      // Arrange
      $("refresh-btn").focus();

      // Act
      renderRetry(() => {});

      // Assert
      expect(document.activeElement?.id).toBe("refresh-btn");
    });
  });
});
