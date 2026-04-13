import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useTrain2GoSource } from "./use-train2go-source";

const mockStoreState = {
  extensionInstalled: true,
  sessionActive: true,
  loading: false,
  lastError: null,
  activities: [
    {
      id: 1,
      date: "2026-04-13",
      sport: "running",
      title: "Run",
      duration: "60min",
      workload: 3,
      status: 0,
    },
  ],
  fetchWeek: vi.fn(),
  fetchDay: vi.fn(),
  openTrain2Go: vi.fn(),
  detectExtension: vi.fn(),
};

vi.mock("../../store/train2go-store", () => ({
  useTrain2GoStore: Object.assign(() => mockStoreState, {
    getState: () => mockStoreState,
  }),
}));

describe("useTrain2GoSource", () => {
  it("returns a CoachingSource with correct static fields", () => {
    const { result } = renderHook(() => useTrain2GoSource());

    expect(result.current.id).toBe("train2go");
    expect(result.current.label).toBe("Train2Go");
    expect(result.current.badge).toBe("T2G");
    expect(result.current.available).toBe(true);
    expect(result.current.connected).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("maps store activities to CoachingActivity format", () => {
    const { result } = renderHook(() => useTrain2GoSource());

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].id).toBe("train2go:1");
    expect(result.current.activities[0].source).toBe("train2go");
    expect(result.current.activities[0].sourceBadge).toBe("T2G");
  });

  it("delegates sync to fetchWeek", () => {
    const { result } = renderHook(() => useTrain2GoSource());

    result.current.sync("2026-04-13");

    expect(mockStoreState.fetchWeek).toHaveBeenCalledWith("2026-04-13");
  });

  it("delegates expand to fetchDay", () => {
    const { result } = renderHook(() => useTrain2GoSource());

    result.current.expand("2026-04-13");

    expect(mockStoreState.fetchDay).toHaveBeenCalledWith("2026-04-13");
  });

  it("connect opens Train2Go and starts polling", async () => {
    vi.useFakeTimers();
    mockStoreState.detectExtension.mockResolvedValue(undefined);
    mockStoreState.openTrain2Go.mockResolvedValue(undefined);
    // Simulate sessionActive becoming true after first detect
    const originalGetState = { ...mockStoreState, sessionActive: true };
    const { useTrain2GoStore } = await import("../../store/train2go-store");
    vi.spyOn(useTrain2GoStore, "getState").mockReturnValue(
      originalGetState as never
    );

    const { result } = renderHook(() => useTrain2GoSource());
    const connectPromise = result.current.connect();

    expect(mockStoreState.openTrain2Go).toHaveBeenCalled();

    // Advance past one poll interval so the awaited setTimeout resolves
    await vi.advanceTimersByTimeAsync(2000);
    await connectPromise;
    expect(mockStoreState.detectExtension).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
