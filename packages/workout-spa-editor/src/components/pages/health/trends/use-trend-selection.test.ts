import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTrendSelection } from "./use-trend-selection";

const DEFAULT_RANGE_DAYS = 90;
const ALT_RANGE_DAYS = 30;

describe("useTrendSelection", () => {
  it("should default to sleep and hrv over a 90 day range", () => {
    // Arrange
    const { result } = renderHook(() => useTrendSelection());

    // Act
    const { selected, rangeDays } = result.current;

    // Assert
    expect([...selected].sort()).toEqual(["hrv", "sleep"]);
    expect(rangeDays).toBe(DEFAULT_RANGE_DAYS);
  });

  it("should add a metric when toggled on", () => {
    // Arrange
    const { result } = renderHook(() => useTrendSelection());

    // Act
    act(() => result.current.toggle("weight"));

    // Assert
    expect(result.current.selected.has("weight")).toBe(true);
  });

  it("should remove a metric when toggled off", () => {
    // Arrange
    const { result } = renderHook(() => useTrendSelection());

    // Act
    act(() => result.current.toggle("sleep"));

    // Assert
    expect(result.current.selected.has("sleep")).toBe(false);
  });

  it("should update the selected range", () => {
    // Arrange
    const { result } = renderHook(() => useTrendSelection());

    // Act
    act(() => result.current.setRangeDays(ALT_RANGE_DAYS));

    // Assert
    expect(result.current.rangeDays).toBe(ALT_RANGE_DAYS);
  });
});
