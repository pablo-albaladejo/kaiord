/**
 * Enforces the persistence boundary for bridge-related runtime state:
 *
 *   - Bridges live in the in-memory `bridgeDiscovery` singleton; there
 *     MUST NOT be a Dexie persistence adapter for them. Adding one
 *     would create a second source of truth and re-introduce the bug
 *     where the SPA reads from one place and the discovery layer
 *     writes to another.
 *   - `train2go-store` and any `garmin-store` / bridge runtime store
 *     MUST remain in-memory Zustand — no `persist(` middleware import
 *     and no direct Dexie writes.
 *
 * See `CLAUDE.md` rule: "Editor runtime → Zustand. Persisted data →
 * Dexie. Local UI → React state."
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const STORE_ROOT = resolve(__dirname, "..", "..", "store");

const BRIDGE_RUNTIME_STORES = [
  "train2go-store.ts",
  "train2go-store-actions.ts",
  "train2go-extension-transport.ts",
  // Future-proof: if a dedicated garmin-store lands, enforce the same
  // rule there too.
  "garmin-store.ts",
  "garmin-store-actions.ts",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe("bridge runtime stores stay in Zustand, never in Dexie", () => {
  it("should not have any bridge-runtime store import zustand/middleware persist", () => {
    // Arrange
    const offenders: string[] = [];

    // Act
    for (const name of BRIDGE_RUNTIME_STORES) {
      const path = join(STORE_ROOT, name);
      let source: string;
      try {
        source = readFileSync(path, "utf8");
      } catch {
        continue; // file may not exist yet
      }
      if (/from\s+["']zustand\/middleware["']/.test(source)) {
        offenders.push(name);
      }
    }

    // Assert
    expect(offenders).toEqual([]);
  });

  it("should not have any bridge-runtime store write to Dexie directly", () => {
    // Arrange
    const offenders: string[] = [];

    // Act
    for (const name of BRIDGE_RUNTIME_STORES) {
      const path = join(STORE_ROOT, name);
      let source: string;
      try {
        source = readFileSync(path, "utf8");
      } catch {
        continue;
      }
      if (
        /from\s+["'][^"']*adapters\/dexie/.test(source) ||
        /createDexiePersistence|KaiordDatabase|dexie-database/i.test(source)
      ) {
        offenders.push(name);
      }
    }

    // Assert
    expect(offenders).toEqual([]);
  });

  it("should not have any bridge-named Dexie persistence adapter", () => {
    // Arrange
    const dexieDir = resolve(__dirname, "..", "dexie");
    const files = walk(dexieDir)
      .map((f) => f.substring(dexieDir.length + 1))
      .filter((f) => /bridge/i.test(f) && !f.endsWith(".test.ts"));

    // Act
    const adapterFiles = files.filter((f) => f.endsWith(".ts"));

    // Assert
    expect(adapterFiles).toEqual([]);
  });
});
