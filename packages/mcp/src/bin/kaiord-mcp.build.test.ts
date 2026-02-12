import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const DIST_BIN = join(__dirname, "../../dist/bin/kaiord-mcp.js");

describe("kaiord-mcp binary build artifact", () => {
  const content = readFileSync(DIST_BIN, "utf-8");
  const lines = content.split("\n");

  it("should start with exactly one shebang", () => {
    expect(lines[0]).toBe("#!/usr/bin/env node");
    expect(lines[1]).not.toContain("#!");
  });

  it("should be valid ESM (no SyntaxError on import)", async () => {
    await expect(import(DIST_BIN)).resolves.toBeDefined();
  });
});
