/**
 * Tests for `useSelectedActivity` — verifies the live-derive behavior
 * that fixes the "Loading description…" stuck state when `expandActivity`
 * upserts the description into Dexie out-of-band.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CoachingActivity } from "../../types/coaching-activity";
import { useSelectedActivity } from "./use-selected-activity";

const baseActivity: CoachingActivity = {
  id: "train2go:abc",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Sweet spot intervals",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: undefined,
};

describe("useSelectedActivity", () => {
  it("should return null when no activity is selected", () => {
    // Arrange
    const byDay = { "2026-04-13": [baseActivity] };

    // Act
    const { result } = renderHook(() => useSelectedActivity(byDay));

    // Assert
    expect(result.current.selectedActivity).toBeNull();
  });

  it("should re-derive the selected activity from byDay so live-query updates propagate", () => {
    // Arrange
    // Initial byDay has the activity with no description.
    const byDayInitial = { "2026-04-13": [baseActivity] };
    const { result, rerender } = renderHook(
      ({ byDay }) => useSelectedActivity(byDay),
      { initialProps: { byDay: byDayInitial } }
    );
    act(() => result.current.setSelectedActivity(baseActivity));
    expect(result.current.selectedActivity?.description).toBeUndefined();

    // Act
    // Live-query tick — byDay flips to a new object with the description populated.
    const byDayPopulated = {
      "2026-04-13": [{ ...baseActivity, description: "Coach prescription" }],
    };
    rerender({ byDay: byDayPopulated });

    // Assert
    expect(result.current.selectedActivity?.description).toBe(
      "Coach prescription"
    );
  });

  it("should clear when setSelectedActivity is called with null", () => {
    // Arrange
    const byDay = { "2026-04-13": [baseActivity] };
    const { result } = renderHook(() => useSelectedActivity(byDay));
    act(() => result.current.setSelectedActivity(baseActivity));
    expect(result.current.selectedActivity).not.toBeNull();

    // Act
    act(() => result.current.setSelectedActivity(null));

    // Assert
    expect(result.current.selectedActivity).toBeNull();
  });
});
