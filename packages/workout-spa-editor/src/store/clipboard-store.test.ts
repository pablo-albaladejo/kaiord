import { describe, expect, it } from "vitest";

import { hasClipboardContent, writeClipboard } from "./clipboard-store";

describe("hasClipboardContent", () => {
  it("should return false initially", () => {
    expect(hasClipboardContent()).toBe(false);
  });

  it("should return true after writing content", async () => {
    await writeClipboard("test-data");

    expect(hasClipboardContent()).toBe(true);
  });
});
