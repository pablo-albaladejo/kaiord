import { describe, expect, it } from "vitest";

import { shortcutKey } from "./shortcut-key";

describe("shortcutKey", () => {
  it.each([
    ["cut", "X"],
    ["copy", "C"],
    ["paste", "V"],
    ["select-all", "A"],
    ["create-block", "G"],
    ["ungroup-block", "G"],
  ])("should read the %s key from the shortcut catalog", (id, key) => {
    // Arrange
    const catalogId = id;

    // Act
    const found = shortcutKey(catalogId);

    // Assert
    expect(found).toBe(key);
  });

  it("should throw for an id the catalog does not hold", () => {
    // Arrange
    const unknownId = "no-such-shortcut";

    // Act
    const read = () => shortcutKey(unknownId);

    // Assert
    expect(read).toThrow();
  });
});
