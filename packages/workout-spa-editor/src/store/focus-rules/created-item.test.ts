import { describe, expect, it } from "vitest";

import { asItemId } from "../providers/item-id";
import { createdItemTarget } from "./created-item";

describe("createdItemTarget", () => {
  it("returns a { kind: 'item', id } target for the new id", () => {
    // Arrange
    const newId = asItemId("new-item-id");

    // Act
    const target = createdItemTarget(newId);

    // Assert
    expect(target).toEqual({ kind: "item", id: "new-item-id" });
  });
});
