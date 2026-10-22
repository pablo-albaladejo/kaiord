import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { load } from "./md-text-hooks.mjs";

let dir: string;

describe("md-text-hooks load", () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "md-hooks-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("should turn a .md file URL into its text as the default export", async () => {
    // Arrange
    const file = join(dir, "prompt.md");
    writeFileSync(file, '# Title\n"quoted"\n');
    const nextLoad = vi.fn();

    // Act
    const result = await load(pathToFileURL(file).href, {}, nextLoad);

    // Assert
    expect(result).toEqual({
      format: "module",
      source: 'export default "# Title\\n\\"quoted\\"\\n";',
      shortCircuit: true,
    });
    expect(nextLoad).not.toHaveBeenCalled();
  });

  it.each([
    ["a .ts file URL", "file:///x/y.ts"],
    ["a non-file .md URL", "https://example.com/readme.md"],
    ["a builtin", "node:fs"],
  ])("should pass %s through to the next loader", async (_label, url) => {
    // Arrange
    const context = { format: undefined };
    const nextLoad = vi.fn().mockResolvedValue("next");

    // Act
    const result = await load(url, context, nextLoad);

    // Assert
    expect(result).toBe("next");
    expect(nextLoad).toHaveBeenCalledWith(url, context);
  });
});
