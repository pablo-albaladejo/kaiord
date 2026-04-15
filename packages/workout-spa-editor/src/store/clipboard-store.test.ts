import { describe, expect, it } from "vitest";

import { hasClipboardContent, writeClipboard } from "./clipboard-store";

describe("hasClipboardContent", () => {
  it("returns false initially", () => {
    expect(hasClipboardContent()).toBe(false);
  });

  it("returns true after writing content", async () => {
    await writeClipboard("test-data");

    expect(hasClipboardContent()).toBe(true);
  });
});
