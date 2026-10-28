import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingActivity } from "../types/coaching-activity";
import type { CoachingSyncState } from "./use-coaching-activities";
import {
  resetDescriptionPrefetch,
  useCoachingDescriptionPrefetch,
} from "./use-coaching-description-prefetch";

const plan = (
  id: string,
  date: string,
  extra: Partial<CoachingActivity> = {}
): CoachingActivity => ({
  id,
  source: "train2go",
  sourceBadge: "T2G",
  date,
  sport: { label: "Running", icon: "R" },
  title: id,
  status: "pending",
  ...extra,
});

const source = (connected: boolean): CoachingSyncState => ({
  id: "train2go",
  label: "Train2Go",
  linked: true,
  connected,
  loading: false,
  error: null,
  lastSyncedAt: undefined,
  sync: async () => {},
  connect: async () => {},
});

const okExpand = () =>
  vi.fn(async () => ({ ok: true as const, activityCount: 1 }));

describe("useCoachingDescriptionPrefetch", () => {
  beforeEach(() => resetDescriptionPrefetch());

  it("should read each day with an unread plan once, not each plan", async () => {
    // Arrange
    const expand = okExpand();
    const byDay = {
      "2026-10-26": [plan("a", "2026-10-26"), plan("b", "2026-10-26")],
      "2026-10-27": [plan("c", "2026-10-27")],
    };

    // Act
    renderHook(() =>
      useCoachingDescriptionPrefetch("p1", byDay, [source(true)], expand)
    );

    // Assert
    await waitFor(() => expect(expand).toHaveBeenCalledTimes(2));
  });

  it("should skip plans whose text is already known, even when empty", async () => {
    // Arrange
    const expand = okExpand();
    const byDay = {
      "2026-10-26": [plan("a", "2026-10-26", { description: "" })],
      "2026-10-27": [plan("b", "2026-10-27", { description: "20' z1" })],
    };

    // Act
    renderHook(() =>
      useCoachingDescriptionPrefetch("p1", byDay, [source(true)], expand)
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(expand).not.toHaveBeenCalled();
  });

  it("should not ask a source that is not connected", async () => {
    // Arrange
    const expand = okExpand();
    const byDay = { "2026-10-26": [plan("a", "2026-10-26")] };

    // Act
    renderHook(() =>
      useCoachingDescriptionPrefetch("p1", byDay, [source(false)], expand)
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(expand).not.toHaveBeenCalled();
  });

  it("should not ask again for a day whose read failed", async () => {
    // Arrange
    const expand = vi.fn(async () => {
      throw new Error("offline");
    });
    const byDay = { "2026-10-26": [plan("a", "2026-10-26")] };
    const { rerender } = renderHook(
      ({ days }) =>
        useCoachingDescriptionPrefetch("p1", days, [source(true)], expand),
      { initialProps: { days: byDay } }
    );
    await waitFor(() => expect(expand).toHaveBeenCalledTimes(1));

    // Act
    rerender({ days: { ...byDay } });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(expand).toHaveBeenCalledTimes(1);
  });
});
