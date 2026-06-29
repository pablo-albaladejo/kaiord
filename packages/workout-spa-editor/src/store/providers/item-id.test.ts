import { describe, expect, it } from "vitest";

import { asItemId } from "./item-id";

describe("ItemId branded type", () => {
  it("should brand a plain string via asItemId", () => {
    // Arrange

    // Act
    const id = asItemId("abc");

    // Assert
    expect(typeof id).toBe("string");
    expect(id).toBe("abc");
  });
});
