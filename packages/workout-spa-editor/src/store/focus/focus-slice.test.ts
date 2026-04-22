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
    // Arrange + Act: the default store state is the system under test.

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("setPendingFocusTarget writes an item target", () => {
    // Arrange
    const target = focusItem(asItemId("step-x"));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(target);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(target);
  });

  it("setPendingFocusTarget writes the empty-state sentinel", () => {
    // Arrange + Act
    useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusEmptyState
    );
  });

  it("setPendingFocusTarget clears via null", () => {
    // Arrange: put the slice into a non-null state first.
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(null);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("overwrites a prior target without throwing", () => {
    // Arrange
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("b")));

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusItem(asItemId("b"))
    );
  });

  it("accepts an id that does not exist in the current workout", () => {
    // Arrange: resolving the id to a DOM node is the hook's job (§7), not
    // the slice's — the slice only stores whatever it's given.

    // Act + Assert
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
    // Arrange + Act: the default store state is the system under test.

    // Assert
    expect(useWorkoutStore.getState().selectionHistory).toEqual([]);
  });
});
