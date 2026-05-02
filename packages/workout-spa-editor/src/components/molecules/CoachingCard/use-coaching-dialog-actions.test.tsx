/**
 * useCoachingDialogActions tests — exercises every match/split branch
 * by injecting fake `useMatchSession` / `useUnmatchSession` modules.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMatch = vi.fn();
const mockUnmatch = vi.fn();

vi.mock("../../../hooks/use-match-session", () => ({
  useMatchSession: () => mockMatch,
}));
vi.mock("../../../hooks/use-unmatch-session", () => ({
  useUnmatchSession: () => mockUnmatch,
}));

import type { ActivityMatchState } from "../../../hooks/use-activity-match-state";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useCoachingDialogActions } from "./use-coaching-dialog-actions";

const activity: CoachingActivity = {
  id: "act-1",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "x",
  status: "pending",
  description: "",
};

const wrap = ({ children }: { children: ReactNode }) => <>{children}</>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCoachingDialogActions — picker open/close", () => {
  it("openPicker flips pickerOpen to true; closePicker flips it back", () => {
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", { kind: "solo" }),
      { wrapper: wrap }
    );

    expect(result.current.pickerOpen).toBe(false);
    act(() => result.current.openPicker());
    expect(result.current.pickerOpen).toBe(true);
    act(() => result.current.closePicker());
    expect(result.current.pickerOpen).toBe(false);
  });
});

describe("useCoachingDialogActions — handleSelectWorkout", () => {
  it("invokes useMatchSession with profileId / activity / workout / source=manual", async () => {
    mockMatch.mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", { kind: "solo" }),
      { wrapper: wrap }
    );

    act(() => result.current.openPicker());
    await act(async () => {
      await result.current.handleSelectWorkout("w-1");
    });

    expect(mockMatch).toHaveBeenCalledWith({
      profileId: "p1",
      coachingActivityId: "act-1",
      workoutId: "w-1",
      source: "manual",
    });
    // Picker closes on success.
    expect(result.current.pickerOpen).toBe(false);
  });

  it("is a no-op when activity is null", async () => {
    const { result } = renderHook(
      () => useCoachingDialogActions(null, "p1", { kind: "solo" }),
      { wrapper: wrap }
    );

    await act(async () => {
      await result.current.handleSelectWorkout("w-1");
    });

    expect(mockMatch).not.toHaveBeenCalled();
  });

  it("is a no-op when targetProfileId is null", async () => {
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, null, { kind: "solo" }),
      { wrapper: wrap }
    );

    await act(async () => {
      await result.current.handleSelectWorkout("w-1");
    });

    expect(mockMatch).not.toHaveBeenCalled();
  });

  it("toggles `matching` true while in flight; resets on completion", async () => {
    let resolve!: () => void;
    mockMatch.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      })
    );
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", { kind: "solo" }),
      { wrapper: wrap }
    );

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleSelectWorkout("w-1");
    });
    await waitFor(() => expect(result.current.matching).toBe(true));

    await act(async () => {
      resolve();
      await promise;
    });

    expect(result.current.matching).toBe(false);
  });
});

describe("useCoachingDialogActions — handleSplit", () => {
  const matchedState: ActivityMatchState = {
    kind: "matched",
    matchId: "m-1",
    workout: { id: "w-1" } as never,
  };

  it("invokes useUnmatchSession with profileId + matchId from matchState", async () => {
    mockUnmatch.mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", matchedState),
      { wrapper: wrap }
    );

    await act(async () => {
      await result.current.handleSplit();
    });

    expect(mockUnmatch).toHaveBeenCalledWith({
      profileId: "p1",
      matchId: "m-1",
    });
  });

  it("is a no-op when matchState is solo", async () => {
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", { kind: "solo" }),
      { wrapper: wrap }
    );

    await act(async () => {
      await result.current.handleSplit();
    });

    expect(mockUnmatch).not.toHaveBeenCalled();
  });

  it("is a no-op when targetProfileId is null", async () => {
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, null, matchedState),
      { wrapper: wrap }
    );

    await act(async () => {
      await result.current.handleSplit();
    });

    expect(mockUnmatch).not.toHaveBeenCalled();
  });

  it("toggles `splitting` true while in flight; resets on completion", async () => {
    let resolve!: () => void;
    mockUnmatch.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      })
    );
    const { result } = renderHook(
      () => useCoachingDialogActions(activity, "p1", matchedState),
      { wrapper: wrap }
    );

    let promise: Promise<void>;
    act(() => {
      promise = result.current.handleSplit();
    });
    await waitFor(() => expect(result.current.splitting).toBe(true));

    await act(async () => {
      resolve();
      await promise;
    });

    expect(result.current.splitting).toBe(false);
  });
});
