import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SessionMoveContext } from "../../../contexts/session-move-context";
import { useDialogMoveTo } from "./use-dialog-move-to";

const withFlow =
  (requestMove: (id: string, day: string) => void) =>
  ({ children }: { children: ReactNode }) => (
    <SessionMoveContext.Provider value={requestMove}>
      {children}
    </SessionMoveContext.Provider>
  );

describe("useDialogMoveTo", () => {
  it("should close the dialog and request the move of the matched workout", () => {
    // Arrange
    const requestMove = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() => useDialogMoveTo("w", onClose), {
      wrapper: withFlow(requestMove),
    });

    // Act
    result.current?.("2026-10-08");

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(requestMove).toHaveBeenCalledWith("w", "2026-10-08");
  });

  it("should offer nothing without a matched workout or outside the flow", () => {
    // Arrange
    const wrapper = withFlow(vi.fn());

    // Act
    const unmatched = renderHook(() => useDialogMoveTo(null, vi.fn()), {
      wrapper,
    });
    const outside = renderHook(() => useDialogMoveTo("w", vi.fn()));

    // Assert
    expect(unmatched.result.current).toBeUndefined();
    expect(outside.result.current).toBeUndefined();
  });
});
