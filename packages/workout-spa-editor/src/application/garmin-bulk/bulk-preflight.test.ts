import { describe, expect, it } from "vitest";

import { bulkPreflight } from "./bulk-preflight";

const READY = {
  routeActive: true,
  bridgeInstalled: true,
  sessionActive: true,
  locks: {},
  secureContext: true,
};

describe("bulkPreflight", () => {
  it.each([
    {
      name: "no export route",
      change: { routeActive: false },
      expected: "no-export-route",
    },
    {
      name: "no bridge",
      change: { bridgeInstalled: false },
      expected: "no-bridge",
    },
    {
      name: "no Garmin session",
      change: { sessionActive: false },
      expected: "no-session",
    },
    {
      name: "an insecure page",
      change: { locks: undefined, secureContext: false },
      expected: "insecure-context",
    },
    {
      name: "a browser without Web Locks",
      change: { locks: undefined },
      expected: "unsupported-browser",
    },
    { name: "everything in place", change: {}, expected: undefined },
  ])("should report $name as $expected", ({ change, expected }) => {
    // Arrange
    const context = { ...READY, ...change };

    // Act
    const failure = bulkPreflight(context);

    // Assert
    expect(failure).toBe(expected);
  });
});
