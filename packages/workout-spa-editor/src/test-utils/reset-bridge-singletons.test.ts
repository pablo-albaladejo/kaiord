import { describe, expect, it } from "vitest";

import {
  BRIDGE_SINGLETON_KEYS,
  resetBridgeSingletons,
} from "./reset-bridge-singletons";

const g = globalThis as unknown as Record<string, unknown>;

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

  it("should have already run from the setup file before this file's tests", () => {
    // Arrange — this file imports nothing from adapters/bridge, so nothing
    // in it can have parked a singleton. Anything present here would have
    // been inherited from whichever file last shared this worker, which is
    // the leak #1094 describes. Deterministic: setup files are re-evaluated
    // before each test file's own imports.
    const inherited = BRIDGE_SINGLETON_KEYS.filter((key) => key in g);

    // Act
    const actual = inherited;

    // Assert
    expect(actual).toEqual([]);
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
