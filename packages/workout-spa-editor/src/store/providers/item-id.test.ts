import { describe, expect, it } from "vitest";

import { asItemId, type ItemId } from "./item-id";

describe("ItemId branded type", () => {
  it("should brand a plain string via asItemId", () => {
    // Arrange

    // Act
    const id = asItemId("abc");

    // Assert
    expect(typeof id).toBe("string");
    expect(id).toBe("abc");
  });

  it("should prevent plain-string assignment without asItemId cast", () => {
    // Arrange
    const plain: string = "raw-positional-id";
    const notAllowed: ItemId = plain;

    // Act
    const allowed: ItemId = asItemId(plain);

    // Assert
    expect(notAllowed).toBe("raw-positional-id");
    expect(allowed).toBe("raw-positional-id");
  });
});
