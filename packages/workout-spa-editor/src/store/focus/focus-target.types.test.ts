import { describe, expect, expectTypeOf, it } from "vitest";

import { asItemId } from "../providers/item-id";
import type {
  FocusTargetEmptyState,
  FocusTargetItem,
} from "./focus-target.types";
import { focusEmptyState, focusItem } from "./focus-target.types";

describe("FocusTarget discriminated union", () => {
  it("should produce a FocusTargetItem with the supplied ItemId via focusItem", () => {
    // Arrange
    const id = asItemId("some-item");

    // Act
    const target = focusItem(id);

    // Assert
    expect(target).toEqual({ kind: "item", id: "some-item" });
    expectTypeOf(target).toEqualTypeOf<FocusTargetItem>();
  });

  it("should expose focusEmptyState as a FocusTargetEmptyState sentinel", () => {
    // Arrange

    // Act
    const sentinel = focusEmptyState;

    // Assert
    expect(sentinel).toEqual({ kind: "empty-state" });
    expectTypeOf(sentinel).toEqualTypeOf<FocusTargetEmptyState>();
  });
});
