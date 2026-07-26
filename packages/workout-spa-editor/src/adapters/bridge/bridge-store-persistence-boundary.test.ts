/**
 * Enforces the persistence boundary for bridge-related runtime state:
 *
 *   - Bridges live in the in-memory `bridgeDiscovery` singleton; there
 *     MUST NOT be a Dexie persistence adapter for them. Adding one
 *     would create a second source of truth and re-introduce the bug
 *     where the SPA reads from one place and the discovery layer
 *     writes to another.
 *   - `train2go-store`, any `garmin-store`, and the bridge connection /
 *     session-probe modules MUST remain in-memory — no `persist(`
 *     middleware import and no direct Dexie writes. Session state is
 *     derived per boot, never a second copy of the truth on disk.
 *
 * See `CLAUDE.md` rule: "Editor runtime → Zustand. Persisted data →
 * Dexie. Local UI → React state."
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = resolve(__dirname, "..", "..");

// Paths are relative to `src/`: bridge runtime state lives both in
// `store/` (Zustand) and in `adapters/bridge/` (plain singletons).
// Files that MUST exist. A rename or a typo here has to fail the suite —
// silently skipping a missing path would disarm the guard for that module.
const BRIDGE_RUNTIME_STORES = [
  "store/train2go-store.ts",
  "store/train2go-store-actions.ts",
  "store/train2go-extension-transport.ts",
  "adapters/bridge/bridge-connection-store.ts",
  "adapters/bridge/bridge-connection-entries.ts",
  "adapters/bridge/bridge-connection-refresh.ts",
  "adapters/bridge/bridge-connection-probe.ts",
  "adapters/bridge/bridge-connection-context.ts",
  "adapters/bridge/bridge-connection-lifecycle.ts",
  "adapters/bridge/bridge-connection-types.ts",
  "adapters/bridge/bridge-session-probes.ts",
  "adapters/bridge/bridge-session-probe-types.ts",
  "adapters/bridge/bridge-ping-session-probes.ts",
];

// Not written yet: if a dedicated garmin-store ever lands, the same rules
// apply to it on arrival. Scanned when present, never asserted to exist.
const FUTURE_BRIDGE_RUNTIME_STORES = [
  "store/garmin-store.ts",
  "store/garmin-store-actions.ts",
];

const readGuardedSources = (): { name: string; source: string }[] =>
  [...BRIDGE_RUNTIME_STORES, ...FUTURE_BRIDGE_RUNTIME_STORES].flatMap(
    (name) => {
      try {
        return [{ name, source: readFileSync(join(SRC_ROOT, name), "utf8") }];
      } catch {
        return [];
      }
    }
  );

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
  it("should have every guarded bridge-runtime store present on disk", () => {
    // Arrange
    const expected = [...BRIDGE_RUNTIME_STORES].sort();

    // Act
    const found = readGuardedSources()
      .map((f) => f.name)
      .filter((name) => BRIDGE_RUNTIME_STORES.includes(name))
      .sort();

    // Assert
    expect(found).toEqual(expected);
  });

  it("should not have any bridge-runtime store import zustand/middleware persist", () => {
    // Arrange
    const files = readGuardedSources();

    // Act
    const offenders = files
      .filter((f) => /from\s+["']zustand\/middleware["']/.test(f.source))
      .map((f) => f.name);

    // Assert
    expect(offenders).toEqual([]);
  });

  it("should not have any bridge-runtime store write to Dexie directly", () => {
    // Arrange
    const files = readGuardedSources();

    // Act
    const offenders = files
      .filter(
        (f) =>
          /from\s+["'][^"']*adapters\/dexie/.test(f.source) ||
          /createDexiePersistence|KaiordDatabase|dexie-database/i.test(f.source)
      )
      .map((f) => f.name);

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
