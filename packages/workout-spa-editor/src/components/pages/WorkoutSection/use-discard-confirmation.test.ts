import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDiscardConfirmation } from "./use-discard-confirmation";

const clearWorkoutMock = vi.fn();
const showConfirmationModalMock = vi.fn();

vi.mock("../../../store", () => ({
  useClearWorkout: () => clearWorkoutMock,
}));

vi.mock("../../../store/selectors", () => ({
  useShowConfirmationModal: () => showConfirmationModalMock,
}));

describe("useDiscardConfirmation", () => {
  beforeEach(() => {
    clearWorkoutMock.mockReset();
    showConfirmationModalMock.mockReset();
  });

  it("should NOT call onAfterConfirm when the discard modal is cancelled", () => {
    // Arrange
    const onAfterConfirm = vi.fn();
    const { result } = renderHook(() => useDiscardConfirmation(onAfterConfirm));

    // Act
    act(() => {
      result.current();
    });
    // Simulate user cancelling: onConfirm is never invoked by the modal.

    // Assert
    expect(showConfirmationModalMock).toHaveBeenCalledTimes(1);
    expect(clearWorkoutMock).not.toHaveBeenCalled();
    expect(onAfterConfirm).not.toHaveBeenCalled();
  });

  it("should call clearWorkout and onAfterConfirm in order when confirmed", () => {
    // Arrange
    const callOrder: string[] = [];
    clearWorkoutMock.mockImplementation(() => callOrder.push("clear"));
    const onAfterConfirm = vi.fn(() => callOrder.push("after"));
    const { result } = renderHook(() => useDiscardConfirmation(onAfterConfirm));

    // Act
    act(() => {
      result.current();
    });
    const config = showConfirmationModalMock.mock.calls[0]?.[0] as {
      onConfirm: () => void;
    };
    act(() => {
      config.onConfirm();
    });

    // Assert
    expect(clearWorkoutMock).toHaveBeenCalledTimes(1);
    expect(onAfterConfirm).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["clear", "after"]);
  });
});
