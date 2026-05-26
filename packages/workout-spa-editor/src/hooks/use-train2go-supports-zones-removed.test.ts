/**
 * Regression guard: use-train2go-supports-zones.ts must stay deleted.
 *
 * Reads all .ts/.tsx sources under packages/workout-spa-editor/src/ and
 * asserts that no file contains the literal string
 * "use-train2go-supports-zones" in an import path or as a string.
 *
 * This test uses only node:fs/node:path so it works in vitest without
 * any DOM setup.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

// __dirname is hooks/; src/ is one level up.
const SPA_SRC = resolve(__dirname, "..");

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

describe("use-train2go-supports-zones deletion guard", () => {
  it("should have no source file under spa-editor/src that references use-train2go-supports-zones", () => {
    // Arrange
    const files = collectSourceFiles(SPA_SRC);

    // Act
    const culprits = files.filter((f) =>
      readFileSync(f, "utf8").includes("use-train2go-supports-zones")
    );

    // Assert
    expect(culprits).toEqual([]);
  });
});
