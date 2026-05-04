import { assert, describe, expect, expectTypeOf, it } from "vitest";

import { asItemId } from "../providers/item-id";
import type {
  FocusTarget,
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

  it("should narrow on `kind` at call sites", () => {
    // Arrange

    // Act
    const target: FocusTarget = focusItem(asItemId("narrow-me"));

    // Assert
    if (target.kind === "item") {
      expectTypeOf(target.id).toBeString();
      expect(target.id).toBe("narrow-me");
    } else {
      assert.fail("Expected item kind");
    }
  });

  it("should narrow on `kind` to the empty-state branch", () => {
    // Arrange
    const target: FocusTarget = focusEmptyState;

    // Act
    if (target.kind === "empty-state") {
      expectTypeOf(target).toEqualTypeOf<FocusTargetEmptyState>();
    } else {
      assert.fail("Expected empty-state kind");
    }

    // Assert
  });
});
