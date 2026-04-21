import { afterEach, describe, expect, it } from "vitest";

import { asItemId } from "../providers/item-id";
import { useWorkoutStore } from "../workout-store";
import { focusEmptyState, focusItem } from "./focus-target.types";

describe("FocusSlice", () => {
  afterEach(() => {
    useWorkoutStore.setState({
      pendingFocusTarget: null,
      selectionHistory: [],
    });
  });

  it("defaults to pendingFocusTarget: null on a fresh store", () => {
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("setPendingFocusTarget writes an item target", () => {
    const target = focusItem(asItemId("step-x"));
    useWorkoutStore.getState().setPendingFocusTarget(target);
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(target);
  });

  it("setPendingFocusTarget writes the empty-state sentinel", () => {
    useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusEmptyState
    );
  });

  it("setPendingFocusTarget clears via null", () => {
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));
    useWorkoutStore.getState().setPendingFocusTarget(null);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("overwrites a prior target without throwing", () => {
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("b")));
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusItem(asItemId("b"))
    );
  });

  it("accepts an id that does not exist in the current workout", () => {
    // The slice is dumb — it only stores the value. Resolving the id to
    // a DOM node is the hook's job (§7), not the slice's.
    expect(() =>
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost-id")))
    ).not.toThrow();
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusItem(asItemId("ghost-id"))
    );
  });

  it("selectionHistory starts empty on a fresh store", () => {
    expect(useWorkoutStore.getState().selectionHistory).toEqual([]);
  });
});
