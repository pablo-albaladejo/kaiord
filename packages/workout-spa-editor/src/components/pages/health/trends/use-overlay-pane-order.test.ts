import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TrendMetricKey } from "./trend-metrics";
import { useOverlayPaneOrder } from "./use-overlay-pane-order";

const setOf = (keys: TrendMetricKey[]) => new Set<TrendMetricKey>(keys);

describe("useOverlayPaneOrder", () => {
  it("should initialize order matching the selected metrics in canonical order", () => {
    // Arrange
    const selected = setOf(["sleep", "hrv", "weight", "steps"]);

    // Act
    const { result } = renderHook(() => useOverlayPaneOrder(selected));

    // Assert
    expect(result.current.paneOrder).toEqual([
      "sleep",
      "hrv",
      "weight",
      "steps",
    ]);
  });

  it("should swap two metrics via reorder using arrayMove", () => {
    // Arrange
    const selected = setOf(["sleep", "hrv", "weight", "steps"]);
    const { result } = renderHook(() => useOverlayPaneOrder(selected));

    // Act
    act(() => result.current.reorder("sleep", "weight"));

    // Assert
    expect(result.current.paneOrder).toEqual([
      "hrv",
      "weight",
      "sleep",
      "steps",
    ]);
  });

  it("should drop a metric when it is removed from the selected set", () => {
    // Arrange
    const initial = setOf(["sleep", "hrv", "weight"]);
    const { result, rerender } = renderHook(
      ({ s }: { s: Set<TrendMetricKey> }) => useOverlayPaneOrder(s),
      { initialProps: { s: initial } }
    );

    // Act
    rerender({ s: setOf(["sleep", "weight"]) });

    // Assert
    expect(result.current.paneOrder).toEqual(["sleep", "weight"]);
  });

  it("should append a newly-selected metric to the end of the order", () => {
    // Arrange
    const initial = setOf(["sleep", "hrv"]);
    const { result, rerender } = renderHook(
      ({ s }: { s: Set<TrendMetricKey> }) => useOverlayPaneOrder(s),
      { initialProps: { s: initial } }
    );

    // Act
    rerender({ s: setOf(["sleep", "hrv", "weight"]) });

    // Assert
    expect(result.current.paneOrder).toEqual(["sleep", "hrv", "weight"]);
  });

  it("should preserve user-reordered positions when toggling an unrelated metric off", () => {
    // Arrange
    const initial = setOf(["sleep", "hrv", "weight", "steps"]);
    const { result, rerender } = renderHook(
      ({ s }: { s: Set<TrendMetricKey> }) => useOverlayPaneOrder(s),
      { initialProps: { s: initial } }
    );
    // User reorders: move hrv ahead of sleep — order becomes [hrv, sleep, weight, steps].
    act(() => result.current.reorder("sleep", "hrv"));
    expect(result.current.paneOrder).toEqual([
      "hrv",
      "sleep",
      "weight",
      "steps",
    ]);

    // Act
    rerender({ s: setOf(["hrv", "sleep", "steps"]) });

    // Assert
    // sleep stays at index 1 (NOT pushed back to canonical position 0).
    expect(result.current.paneOrder).toEqual(["hrv", "sleep", "steps"]);
  });
});
