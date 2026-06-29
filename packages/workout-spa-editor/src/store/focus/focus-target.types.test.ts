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
    const target = focusItem(id);
    expect(target).toEqual({ kind: "item", id: "some-item" });

    // Act
    expectTypeOf(target).toEqualTypeOf<FocusTargetItem>();

    // Assert
  });

  it("should expose focusEmptyState as a FocusTargetEmptyState sentinel", () => {
    // Arrange
    expect(focusEmptyState).toEqual({ kind: "empty-state" });

    // Act
    expectTypeOf(focusEmptyState).toEqualTypeOf<FocusTargetEmptyState>();

    // Assert
  });
});
