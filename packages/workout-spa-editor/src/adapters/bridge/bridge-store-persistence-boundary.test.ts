/**
 * Enforces the Dexie-vs-Zustand persistence boundary for bridge-related
 * runtime state:
 *
 *   - The new `bridges` Dexie store IS the persistence layer for the
 *     registry.
 *   - `train2go-store` and any `garmin-store` / bridge runtime store
 *     MUST remain in-memory Zustand — no `persist(` middleware import
 *     and no direct Dexie writes.
 *
 * See `CLAUDE.md` rule: "Editor runtime → Zustand. Persisted data →
 * Dexie. Local UI → React state." — and the proposal's
 * Dexie-vs-Zustand boundary clause.
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
  it("no bridge-runtime store imports zustand/middleware persist", () => {
    const offenders: string[] = [];
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

    expect(offenders).toEqual([]);
  });

  it("no bridge-runtime store writes to Dexie directly", () => {
    const offenders: string[] = [];
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

    expect(offenders).toEqual([]);
  });

  it("the Dexie bridges repository is the ONLY bridge-named persistence adapter", () => {
    const dexieDir = resolve(__dirname, "..", "dexie");
    const files = walk(dexieDir)
      .map((f) => f.substring(dexieDir.length + 1))
      .filter((f) => /bridge/i.test(f) && !f.endsWith(".test.ts"));

    // Exactly one adapter source + any non-test bridge artefact if added
    // later. The regression bar is: no duplicated persistence paths.
    const adapterFiles = files.filter((f) => f.endsWith(".ts"));
    expect(adapterFiles).toEqual(["dexie-bridge-repository.ts"]);
  });
});
