/**
 * Clears the two runtime singletons that park themselves on `globalThis`.
 *
 * `bridge-discovery` and `bridge-connection-store` park there on purpose:
 * a Vite hot update would otherwise build a second instance while mounted
 * hooks stay subscribed to the first. That is a real property in dev, and
 * its own tests pin it.
 *
 * The collateral damage is in test. Vitest's `forks` pool reuses worker
 * processes between test files, and `globalThis` lives in the process
 * rather than the module registry — so `isolate: true` does NOT reset
 * these, and every file sharing a worker inherits whatever the previous
 * file left behind.
 *
 * Calling this at the TOP LEVEL of the setup file (not in `beforeEach`)
 * is what makes it work: Vitest re-evaluates setup files per test file,
 * before that file's own imports run. The stale instance is gone before
 * anything can resolve to it, so every module inside one file still agrees
 * on a single store — the property the parking exists to protect — while
 * nothing crosses the file boundary.
 *
 * See #1094.
 */
const DISCOVERY_KEY = "__KAIORD_BRIDGE_DISCOVERY__";
const CONNECTIONS_KEY = "__KAIORD_BRIDGE_CONNECTIONS__";

export const BRIDGE_SINGLETON_KEYS = [DISCOVERY_KEY, CONNECTIONS_KEY] as const;

export const resetBridgeSingletons = (): void => {
  const g = globalThis as unknown as Record<string, unknown>;
  for (const key of BRIDGE_SINGLETON_KEYS) {
    delete g[key];
  }
};
