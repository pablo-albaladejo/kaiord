/**
 * Mechanical guard (spec: spa-integration-adapters): `chrome.runtime`
 * messaging never leaves the transport layer. Only modules under
 * `adapters/bridge/` may call `chrome.runtime.sendMessage`/`connect`;
 * everything else routes through `sendBridgeMessage` + operation queue.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "..");

const FORBIDDEN = /chrome\.runtime\.(sendMessage|connect)\s*\(/;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "test-utils" || entry === "e2e" ? [] : walk(path);
    }
    if (!/\.(ts|tsx)$/.test(entry) || /\.test\.(ts|tsx)$/.test(entry)) {
      return [];
    }
    return [path];
  });

describe("bridge transport encapsulation", () => {
  it("should keep chrome.runtime messaging inside adapters/bridge/", () => {
    // Arrange
    const files = walk(SRC);

    // Act
    const offenders = files.filter((file) => {
      const rel = relative(SRC, file).split(sep).join("/");
      if (rel.startsWith("adapters/bridge/")) return false;
      return FORBIDDEN.test(readFileSync(file, "utf8"));
    });

    // Assert
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });
});
