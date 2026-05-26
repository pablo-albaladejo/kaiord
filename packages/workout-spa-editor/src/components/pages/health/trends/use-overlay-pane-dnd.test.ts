import type { DragEndEvent } from "@dnd-kit/core";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TrendMetricKey } from "./trend-metrics";
import { useOverlayPaneDnd } from "./use-overlay-pane-dnd";

const makeEvent = (
  activeId: string | null,
  overId: string | null
): DragEndEvent =>
  ({
    active: activeId ? { id: activeId } : null,
    over: overId ? { id: overId } : null,
  }) as unknown as DragEndEvent;

describe("useOverlayPaneDnd", () => {
  it("should expose memoized sortable ids equal to the paneOrder", () => {
    // Arrange
    const paneOrder: TrendMetricKey[] = ["sleep", "hrv"];
    const reorder = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useOverlayPaneDnd({ paneOrder, reorder })
    );

    // Assert
    expect(result.current.sortableIds).toEqual(["sleep", "hrv"]);
  });

  it("should call reorder with active and over ids on drag end", () => {
    // Arrange
    const reorder = vi.fn();
    const paneOrder: TrendMetricKey[] = ["sleep", "hrv", "weight"];
    const { result } = renderHook(() =>
      useOverlayPaneDnd({ paneOrder, reorder })
    );

    // Act
    result.current.handleDragEnd(makeEvent("sleep", "weight"));

    // Assert
    expect(reorder).toHaveBeenCalledWith("sleep", "weight");
  });

  it("should not call reorder when over is null", () => {
    // Arrange
    const reorder = vi.fn();
    const { result } = renderHook(() =>
      useOverlayPaneDnd({ paneOrder: ["sleep"], reorder })
    );

    // Act
    result.current.handleDragEnd(makeEvent("sleep", null));

    // Assert
    expect(reorder).not.toHaveBeenCalled();
  });

  it("should not call reorder when active and over share the same id", () => {
    // Arrange
    const reorder = vi.fn();
    const { result } = renderHook(() =>
      useOverlayPaneDnd({ paneOrder: ["sleep"], reorder })
    );

    // Act
    result.current.handleDragEnd(makeEvent("sleep", "sleep"));

    // Assert
    expect(reorder).not.toHaveBeenCalled();
  });
});
