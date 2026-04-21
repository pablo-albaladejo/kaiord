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
    const target = focusItem(asItemId("some-item"));
    expect(target).toEqual({ kind: "item", id: "some-item" });
    expectTypeOf(target).toEqualTypeOf<FocusTargetItem>();
  });

  it("focusEmptyState is a FocusTargetEmptyState sentinel", () => {
    expect(focusEmptyState).toEqual({ kind: "empty-state" });
    expectTypeOf(focusEmptyState).toEqualTypeOf<FocusTargetEmptyState>();
  });

  it("narrows on `kind` at call sites", () => {
    const target: FocusTarget = focusItem(asItemId("narrow-me"));
    if (target.kind === "item") {
      // In this branch the type system knows `id` exists.
      expectTypeOf(target.id).toBeString();
      expect(target.id).toBe("narrow-me");
    } else {
      // Dead branch for this specific value; kept to exercise narrowing.
      assert.fail("Expected item kind");
    }
  });

  it("narrows on `kind` to the empty-state branch", () => {
    const target: FocusTarget = focusEmptyState;
    if (target.kind === "empty-state") {
      // No `id` in this branch — the compile-time shape is just `{ kind }`.
      expectTypeOf(target).toEqualTypeOf<FocusTargetEmptyState>();
    } else {
      assert.fail("Expected empty-state kind");
    }
  });
});
