/**
 * Route registry ↔ router parity.
 *
 * `route-segments.json` lists the first path segment of every route the
 * SPA serves. `scripts/check-site-links.mjs` reads it to validate
 * `https://kaiord.com/app/#/<segment>` links in the built site, so a
 * route added to or removed from `AppRoutes.tsx` without updating the
 * registry would let a dead deep link ship (or reject a live one).
 * The routes are read straight from the router source instead of a
 * hand-kept mirror.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import routeSegments from "./route-segments.json";

const HERE = dirname(fileURLToPath(import.meta.url));

function firstSegmentsIn(source: string): string[] {
  const segments = new Set<string>();
  for (const match of source.matchAll(/\bpath="\/([^/"?:*]+)/g)) {
    segments.add(match[1]);
  }
  return [...segments].sort();
}

describe("route-segments.json", () => {
  it("should list exactly the first segments routed in AppRoutes.tsx", () => {
    // Arrange
    const source = readFileSync(join(HERE, "..", "AppRoutes.tsx"), "utf8");

    // Act
    const routed = firstSegmentsIn(source);

    // Assert
    expect(routed.length).toBeGreaterThan(0);
    expect([...routeSegments].sort()).toEqual(routed);
  });

  it("should not contain duplicates", () => {
    // Arrange
    const segments = [...routeSegments];

    // Act
    const unique = new Set(segments);

    // Assert
    expect(unique.size).toBe(segments.length);
  });
});
