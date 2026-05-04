import { afterEach, describe, expect, it } from "vitest";

import { asItemId } from "../providers/item-id";
import { useWorkoutStore } from "../workout-store";
import { focusEmptyState, focusItem } from "./focus-target.types";

describe("FocusSlice", () => {
  afterEach(() => {
    useWorkoutStore.setState({
      pendingFocusTarget: null,
    });
  });

  it("should default to pendingFocusTarget: null on a fresh store", () => {
    // Arrange

    // Act

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("should write an item target via setPendingFocusTarget", () => {
    // Arrange
    const target = focusItem(asItemId("step-x"));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(target);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(target);
  });

  it("should write the empty-state sentinel via setPendingFocusTarget", () => {
    // Arrange

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusEmptyState
    );
  });

  it("should clear via null through setPendingFocusTarget", () => {
    // Arrange
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(null);

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("should overwrite a prior target without throwing", () => {
    // Arrange
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("a")));

    // Act
    useWorkoutStore.getState().setPendingFocusTarget(focusItem(asItemId("b")));

    // Assert
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusItem(asItemId("b"))
    );
  });

  it("should accept an id that does not exist in the current workout", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost-id")))
    ).not.toThrow();
    expect(useWorkoutStore.getState().pendingFocusTarget).toEqual(
      focusItem(asItemId("ghost-id"))
    );
  });

  it("should start selectionHistory empty on a fresh store", () => {
    // Arrange

    // Act

    // Assert
    expect(useWorkoutStore.getState().undoHistory).toEqual([]);
  });
});
