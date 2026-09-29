import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { GarminRemovalEntry } from "../../../types/garmin-removal-entry";
import { useGarminPlacement } from "./useGarminPlacement";

const ENTRY = {
  workoutScheduleId: "5000",
  date: "2026-10-04",
} as GarminRemovalEntry;
const OTHER_DATE = "2026-10-03";
const push = vi.fn();
const actions = { confirm: vi.fn(), dismiss: vi.fn() };

vi.mock("./useGarminPush", () => ({ useGarminPush: () => ({ push }) }));
vi.mock("./useGarminPlacementActions", () => ({
  useGarminPlacementActions: () => actions,
}));

const WORKOUT = { id: "workout-1" } as WorkoutRecord;

const noticeWith = (
  overrides: Partial<GarminPlacementNotice> = {}
): GarminPlacementNotice => ({
  removable: [],
  setLastRun: vi.fn(),
  ...overrides,
});

describe("useGarminPlacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockResolvedValue({ kind: "library-only", reason: "bridge-outdated" });
    actions.confirm.mockResolvedValue({ kind: "scheduled" });
    actions.dismiss.mockResolvedValue(true);
  });

  it("should hand each run's outcome to the notice, which outlives the control", async () => {
    // Arrange
    const notice = noticeWith();
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.send());

    // Assert
    expect(notice.setLastRun).toHaveBeenCalledWith({
      kind: "library-only",
      reason: "bridge-outdated",
    });
    expect(result.current.busy).toBe(false);
  });

  it("should expose the notice's result and dismissable entries", () => {
    // Arrange
    const notice = noticeWith({
      result: { kind: "uncertain", date: ENTRY.date, canConfirm: true },
      removable: [ENTRY],
    });

    // Act
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Assert
    expect(result.current.result).toEqual(notice.result);
    expect(result.current.removable).toEqual([ENTRY]);
  });

  it("should send anyway with the override flag", async () => {
    // Arrange
    const notice = noticeWith();
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.sendAnyway());

    // Assert
    expect(push).toHaveBeenCalledWith({ sendAnyway: true });
  });

  it("should record the confirmed placement", async () => {
    // Arrange
    const notice = noticeWith();
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.confirm());

    // Assert
    expect(notice.setLastRun).toHaveBeenCalledWith({ kind: "scheduled" });
  });

  it("should keep the last outcome when nothing was pushed", async () => {
    // Arrange
    push.mockResolvedValue(undefined);
    const notice = noticeWith();
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.send());

    // Assert
    expect(notice.setLastRun).not.toHaveBeenCalled();
  });

  it("should clear an answered left-behind warning after a dismissal", async () => {
    // Arrange
    const notice = noticeWith({
      result: { kind: "duplicate-left", dates: [ENTRY.date] },
      removable: [ENTRY],
    });
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.dismiss(ENTRY.workoutScheduleId));

    // Assert
    expect(actions.dismiss).toHaveBeenCalledWith(ENTRY.workoutScheduleId);
    expect(notice.setLastRun).toHaveBeenCalledWith(undefined);
  });

  it("should keep the left-behind warning for the dates still left after one dismissal", async () => {
    // Arrange
    const notice = noticeWith({
      result: { kind: "duplicate-left", dates: [OTHER_DATE, ENTRY.date] },
      removable: [ENTRY],
    });
    const { result } = renderHook(() => useGarminPlacement(WORKOUT, notice));

    // Act
    await act(() => result.current.dismiss(ENTRY.workoutScheduleId));

    // Assert
    expect(notice.setLastRun).toHaveBeenCalledExactlyOnceWith({
      kind: "duplicate-left",
      dates: [OTHER_DATE],
    });
  });
});
