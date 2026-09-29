import { describe, expect, it } from "vitest";

import { bulkPreflight } from "./bulk-preflight";

const LOCKS = {};

describe("bulkPreflight", () => {
  it.each([
    {
      name: "no export route",
      input: { routeActive: false, locks: LOCKS, secureContext: true },
      expected: "no-export-route",
    },
    {
      name: "an insecure page",
      input: { routeActive: true, locks: undefined, secureContext: false },
      expected: "insecure-context",
    },
    {
      name: "a browser without Web Locks",
      input: { routeActive: true, locks: undefined, secureContext: true },
      expected: "unsupported-browser",
    },
    {
      name: "a route and Web Locks",
      input: { routeActive: true, locks: LOCKS, secureContext: true },
      expected: undefined,
    },
  ])("should report $name as $expected", ({ input, expected }) => {
    // Arrange
    const context = input;

    // Act
    const failure = bulkPreflight(context);

    // Assert
    expect(failure).toBe(expected);
  });
});
