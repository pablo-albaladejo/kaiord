import { describe, expect, it } from "vitest";

import {
  BRIDGE_SINGLETON_KEYS,
  resetBridgeSingletons,
} from "./reset-bridge-singletons";

const g = globalThis as unknown as Record<string, unknown>;

// Captured at MODULE LOAD — after setupFiles have run, before any test in
// this file has. Reading it inside a test would be vacuous: the `afterEach`
// below, and the first case's own cleanup, delete these keys long before a
// later case could observe them.
const KEYS_PRESENT_AT_LOAD = [
  "__KAIORD_BRIDGE_DISCOVERY__",
  "__KAIORD_BRIDGE_CONNECTIONS__",
].filter((key) => key in g);

describe("resetBridgeSingletons", () => {
  it("should delete a singleton left behind by another test file", () => {
    // Arrange — exactly what a worker-sharing sibling leaves on globalThis.
    for (const key of BRIDGE_SINGLETON_KEYS) {
      g[key] = { __stale: true };
    }

    // Act
    resetBridgeSingletons();

    // Assert
    for (const key of BRIDGE_SINGLETON_KEYS) {
      expect(key in g).toBe(false);
    }
  });

  it("should cover both parked singletons", () => {
    // Arrange
    const expected = [
      "__KAIORD_BRIDGE_DISCOVERY__",
      "__KAIORD_BRIDGE_CONNECTIONS__",
    ];

    // Act
    const actual = [...BRIDGE_SINGLETON_KEYS];

    // Assert
    expect(actual).toEqual(expected);
  });

  it("should have already cleared the seeded stale singletons", () => {
    // Arrange — `seed-stale-bridge-singletons.ts` parks a stale marker on
    // both keys and runs BEFORE `test-setup.ts` (setupFiles are ordered), so
    // both were definitely present a moment before this module loaded. That
    // is what stops the assertion being vacuous: on a fresh worker an
    // "absent" check passes whether or not the cleanup still exists, whereas
    // with a seed in front of it, removing `resetBridgeSingletons()` from the
    // setup leaves the marker behind and fails this in every file.
    const observedAtLoad = KEYS_PRESENT_AT_LOAD;

    // Act
    const survivors = observedAtLoad;

    // Assert
    expect(survivors).toEqual([]);
  });

  it("should be a no-op when nothing was parked", () => {
    // Arrange
    resetBridgeSingletons();

    // Act
    const act = () => resetBridgeSingletons();

    // Assert
    expect(act).not.toThrow();
  });
});
