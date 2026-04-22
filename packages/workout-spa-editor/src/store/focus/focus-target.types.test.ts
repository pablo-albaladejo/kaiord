import { assert, describe, expect, expectTypeOf, it } from "vitest";

import { asItemId } from "../providers/item-id";
import type {
  FocusTarget,
  FocusTargetEmptyState,
  FocusTargetItem,
} from "./focus-target.types";
import { focusEmptyState, focusItem } from "./focus-target.types";

describe("FocusTarget discriminated union", () => {
  it("focusItem produces a FocusTargetItem with the supplied ItemId", () => {
    // Arrange
    const id = asItemId("some-item");

    // Act
    const target = focusItem(id);

    // Assert
    expect(target).toEqual({ kind: "item", id: "some-item" });
    expectTypeOf(target).toEqualTypeOf<FocusTargetItem>();
  });

  it("focusEmptyState is a FocusTargetEmptyState sentinel", () => {
    // Arrange + Act: focusEmptyState is a pre-built sentinel constant.

    // Assert
    expect(focusEmptyState).toEqual({ kind: "empty-state" });
    expectTypeOf(focusEmptyState).toEqualTypeOf<FocusTargetEmptyState>();
  });

  it("narrows on `kind` at call sites", () => {
    // Arrange
    const target: FocusTarget = focusItem(asItemId("narrow-me"));

    // Act + Assert: the conditional narrows the type inside the branch.
    if (target.kind === "item") {
      expectTypeOf(target.id).toBeString();
      expect(target.id).toBe("narrow-me");
    } else {
      assert.fail("Expected item kind");
    }
  });

  it("narrows on `kind` to the empty-state branch", () => {
    // Arrange
    const target: FocusTarget = focusEmptyState;

    // Act + Assert
    if (target.kind === "empty-state") {
      expectTypeOf(target).toEqualTypeOf<FocusTargetEmptyState>();
    } else {
      assert.fail("Expected empty-state kind");
    }
  });
});
