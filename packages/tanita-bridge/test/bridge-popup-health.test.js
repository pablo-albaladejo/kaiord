// Kaiord Bridge Core — vendored unit tests for bridge-popup-health.js.
// Master: packages/_shared/bridge-core/test/bridge-popup-health.test.js. Never
// edit a vendored copy — edit the master and run `pnpm bridge:sync`. Every
// bridge runs this suite against its own vendored copy, so a drifted copy
// fails where it is used rather than only in the parity guard.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  KD_HEALTH_KEY,
  readHealth,
  nextHealth,
  recordProbe,
} = require("../bridge-popup-health.js");

const NOW_MS = new Date("2026-05-02T10:00:00Z").getTime();
const EARLIER_MS = new Date("2026-04-23T08:00:00Z").getTime();

// The shared chrome-mock's storage is promise-based; the popups (and this
// module) use the callback form Chrome actually gives an extension, so the
// suite supplies its own stub rather than bending the shared one.
const stubStorage = (seed = {}) => {
  const store = { ...seed };
  globalThis.chrome = {
    runtime: { lastError: undefined },
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          const out = {};
          for (const key of keys) if (key in store) out[key] = store[key];
          cb(out);
        }),
        set: vi.fn((items, cb) => {
          Object.assign(store, items);
          if (cb) cb();
        }),
      },
    },
  };
  return store;
};

describe("bridge-popup-health (vendored)", () => {
  let originalChrome;

  beforeEach(() => {
    originalChrome = globalThis.chrome;
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  describe("nextHealth", () => {
    it("should stamp the first observed failure", () => {
      // Arrange
      const previous = {};

      // Act
      const next = nextHealth(previous, false, NOW_MS);

      // Assert
      expect(next).toEqual({ brokenSince: NOW_MS });
    });

    it("should keep the original stamp across later failures", () => {
      // Arrange
      const previous = { brokenSince: EARLIER_MS };

      // Act
      const next = nextHealth(previous, false, NOW_MS);

      // Assert
      // Overwriting would make a week-old outage read as new on every open.
      expect(next.brokenSince).toBe(EARLIER_MS);
    });

    it("should clear the outage on a success", () => {
      // Arrange
      const previous = { brokenSince: EARLIER_MS };

      // Act
      const next = nextHealth(previous, true, NOW_MS);

      // Assert
      // A bridge that breaks, is fixed, then breaks again must date the
      // current outage rather than the first one ever.
      expect(next).toEqual({ lastOkAt: NOW_MS });
    });
  });

  describe("readHealth", () => {
    it("should return the stored record", async () => {
      // Arrange
      stubStorage({ [KD_HEALTH_KEY]: { brokenSince: EARLIER_MS } });

      // Act
      const health = await readHealth();

      // Assert
      expect(health).toEqual({ brokenSince: EARLIER_MS });
    });

    it("should read an absent record as never observed rather than as an error", async () => {
      // Arrange
      stubStorage();

      // Act
      const health = await readHealth();

      // Assert
      expect(health).toEqual({});
    });

    it("should resolve empty when storage is unavailable", async () => {
      // Arrange
      globalThis.chrome = {};

      // Act
      const health = await readHealth();

      // Assert
      // Storage is best-effort: losing it costs the date, not the popup.
      expect(health).toEqual({});
    });
  });

  describe("recordProbe", () => {
    it("should report no date on the first failure it observes", async () => {
      // Arrange
      const store = stubStorage();

      // Act
      const health = await recordProbe(false, NOW_MS);

      // Assert
      // "Nothing has reached Kaiord since today" is vacuous, so the first
      // observation stamps the record but renders the dateless copy.
      expect(health.since).toBeNull();
      expect(store[KD_HEALTH_KEY].brokenSince).toBe(NOW_MS);
    });

    it("should report the known outage start on a later failure", async () => {
      // Arrange
      stubStorage({ [KD_HEALTH_KEY]: { brokenSince: EARLIER_MS } });

      // Act
      const health = await recordProbe(false, NOW_MS);

      // Assert
      expect(health.since).toBe(EARLIER_MS);
      expect(health.brokenSince).toBe(EARLIER_MS);
    });

    it("should report no date on a success", async () => {
      // Arrange
      stubStorage({ [KD_HEALTH_KEY]: { brokenSince: EARLIER_MS } });

      // Act
      const health = await recordProbe(true, NOW_MS);

      // Assert
      expect(health.since).toBeNull();
      expect(health.brokenSince).toBeUndefined();
      expect(health.lastOkAt).toBe(NOW_MS);
    });

    it("should persist the folded record", async () => {
      // Arrange
      const store = stubStorage({ [KD_HEALTH_KEY]: { brokenSince: EARLIER_MS } });

      // Act
      await recordProbe(true, NOW_MS);

      // Assert
      expect(store[KD_HEALTH_KEY]).toEqual({ lastOkAt: NOW_MS });
    });

    it("should still report a verdict when storage is unavailable", async () => {
      // Arrange
      globalThis.chrome = {};

      // Act
      const health = await recordProbe(false, NOW_MS);

      // Assert
      expect(health.since).toBeNull();
      expect(health.brokenSince).toBe(NOW_MS);
    });
  });
});
