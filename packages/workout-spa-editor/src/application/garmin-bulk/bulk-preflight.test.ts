import { describe, expect, it } from "vitest";

import type { ConnectionState } from "../connections/connection-state";
import { bulkPreflight } from "./bulk-preflight";

const READY = {
  routeActive: true,
  connection: "working" as ConnectionState,
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
      name: "no extension",
      change: { connection: "not-installed" as ConnectionState },
      expected: "not-installed",
    },
    {
      name: "an outdated extension",
      change: { connection: "outdated" as ConnectionState },
      expected: "outdated",
    },
    {
      name: "a sign-in Garmin refused",
      change: { connection: "signed-out" as ConnectionState },
      expected: "signed-out",
    },
    {
      name: "a check that could not tell why",
      change: { connection: "not-answering" as ConnectionState },
      expected: "not-answering",
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
