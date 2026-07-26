/**
 * Parity between the SPA's snapshot-push allowlist and the bridge-core sync
 * script's own `SNAPSHOT_BRIDGES` list. Reads the script source rather than
 * mirroring its values, so vendoring the snapshot handler into a new bridge
 * without widening the push allowlist (or vice versa) fails loudly.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SNAPSHOT_CAPABLE_BRIDGE_IDS } from "./snapshot-capable-bridges";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..", "..", "..", "..");

const readSyncScriptSnapshotBridges = (): string[] => {
  const source = readFileSync(
    join(REPO_ROOT, "scripts", "sync-bridge-core.mjs"),
    "utf-8"
  );
  const match = /SNAPSHOT_BRIDGES\s*=\s*(\[[^\]]*\])/.exec(source);
  if (!match) {
    throw new Error(
      "No SNAPSHOT_BRIDGES found in scripts/sync-bridge-core.mjs"
    );
  }
  return JSON.parse(match[1].replace(/'/g, '"')) as string[];
};

describe("SNAPSHOT_CAPABLE_BRIDGE_IDS", () => {
  it("should match the bridge-core sync script's SNAPSHOT_BRIDGES list", () => {
    // Arrange
    const fromScript = readSyncScriptSnapshotBridges();

    // Act
    const fromSpa = [...SNAPSHOT_CAPABLE_BRIDGE_IDS].sort();

    // Assert
    expect(fromSpa).toEqual([...fromScript].sort());
  });

  it("should exclude bridges that never vendored the snapshot handler", () => {
    // Arrange

    // Act
    const result = [...SNAPSHOT_CAPABLE_BRIDGE_IDS];

    // Assert
    expect(result).not.toContain("whoop-bridge");
    expect(result).not.toContain("tanita-bridge");
    expect(result).not.toContain("trainingpeaks-bridge");
  });
});
