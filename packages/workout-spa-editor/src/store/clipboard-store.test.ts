import { describe, expect, it } from "vitest";

import { hasClipboardContent, writeClipboard } from "./clipboard-store";

describe("hasClipboardContent", () => {
  it("should return false initially", () => {
    // Arrange

    // Act

    // Assert
    expect(hasClipboardContent()).toBe(false);
  });

  it("should return true after writing content", async () => {
    // Arrange

    // Act
    await writeClipboard("test-data");

    // Assert
    expect(hasClipboardContent()).toBe(true);
  });
});
